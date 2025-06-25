"""
File upload security and performance testing
"""
import pytest
import asyncio
import tempfile
import os
from io import BytesIO
from unittest.mock import patch, AsyncMock, Mock
from datetime import datetime, timezone
import mimetypes
import hashlib
import aiofiles

from app.services.file_service import FileService, FileValidationError, SecurityScanError
from app.models.attachment import Attachment
from app.models.task import Task
from app.models.user import User
from tests.factories import TaskFactory, UserFactory, AttachmentFactory


class TestFileUploadSecurity:
    """Test file upload security validations."""
    
    @pytest.mark.asyncio
    async def test_malicious_file_detection(self):
        """Test detection of malicious files."""
        file_service = FileService()
        
        # Test various malicious file types
        malicious_files = [
            # Executable files
            (b'\x4d\x5a', 'malware.exe', 'application/x-executable'),
            # Script files with malicious content
            (b'<script>alert("xss")</script>', 'script.html', 'text/html'),
            # PHP backdoor
            (b'<?php system($_GET["cmd"]); ?>', 'backdoor.php', 'application/x-php'),
            # Binary disguised as image
            (b'\x4d\x5a' + b'\x00' * 100 + b'JFIF', 'fake.jpg', 'image/jpeg'),
        ]
        
        for content, filename, content_type in malicious_files:
            file_obj = BytesIO(content)
            
            with pytest.raises(FileValidationError):
                await file_service.validate_file_security(
                    file_obj, filename, content_type
                )
    
    @pytest.mark.asyncio
    async def test_file_type_validation(self):
        """Test file type restrictions."""
        file_service = FileService()
        
        # Allowed file types
        allowed_files = [
            (b'\xff\xd8\xff', 'photo.jpg', 'image/jpeg'),
            (b'\x89PNG\r\n\x1a\n', 'image.png', 'image/png'),
            (b'%PDF-1.4', 'document.pdf', 'application/pdf'),
            (b'Hello, World!', 'text.txt', 'text/plain'),
        ]
        
        for content, filename, content_type in allowed_files:
            file_obj = BytesIO(content)
            
            # Should not raise exception for allowed types
            try:
                await file_service.validate_file_security(file_obj, filename, content_type)
                is_valid = True
            except FileValidationError:
                is_valid = False
            
            assert is_valid, f"Valid file {filename} was rejected"
        
        # Disallowed file types
        disallowed_files = [
            (b'#!/bin/bash\nrm -rf /', 'script.sh', 'application/x-shellscript'),
            (b'@echo off\ndel /f /q *.*', 'virus.bat', 'application/x-msdos-program'),
        ]
        
        for content, filename, content_type in disallowed_files:
            file_obj = BytesIO(content)
            
            with pytest.raises(FileValidationError):
                await file_service.validate_file_security(file_obj, filename, content_type)
    
    @pytest.mark.asyncio
    async def test_file_size_limits(self):
        """Test file size restrictions."""
        file_service = FileService(max_file_size=1024*1024)  # 1MB limit
        
        # Test file within limit
        small_content = b'x' * (512 * 1024)  # 512KB
        small_file = BytesIO(small_content)
        
        # Should not raise exception
        await file_service.validate_file_size(small_file, 'small.txt')
        
        # Test file exceeding limit
        large_content = b'x' * (2 * 1024 * 1024)  # 2MB
        large_file = BytesIO(large_content)
        
        with pytest.raises(FileValidationError):
            await file_service.validate_file_size(large_file, 'large.txt')
    
    @pytest.mark.asyncio
    async def test_filename_sanitization(self):
        """Test filename sanitization for security."""
        file_service = FileService()
        
        dangerous_filenames = [
            '../../../etc/passwd',
            '..\\..\\windows\\system32\\config\\sam',
            'file.txt; rm -rf /',
            'file<script>alert(1)</script>.txt',
            'file\x00.txt',
            'file\n\r.txt',
        ]
        
        for dangerous_name in dangerous_filenames:
            sanitized = file_service.sanitize_filename(dangerous_name)
            
            # Should not contain path traversal
            assert '..' not in sanitized
            assert '/' not in sanitized
            assert '\\' not in sanitized
            
            # Should not contain special characters
            assert '<' not in sanitized
            assert '>' not in sanitized
            assert '\x00' not in sanitized
            assert '\n' not in sanitized
            assert '\r' not in sanitized
    
    @pytest.mark.asyncio
    async def test_virus_scanning_integration(self):
        """Test integration with virus scanning service."""
        file_service = FileService()
        
        # Mock virus scanner
        with patch('app.services.virus_scanner.scan_file') as mock_scan:
            # Test clean file
            mock_scan.return_value = {'status': 'clean', 'threats': []}
            
            clean_file = BytesIO(b'Clean file content')
            result = await file_service.scan_for_viruses(clean_file, 'clean.txt')
            assert result['status'] == 'clean'
            
            # Test infected file
            mock_scan.return_value = {'status': 'infected', 'threats': ['Win32.TestVirus']}
            
            infected_file = BytesIO(b'Infected file content')
            
            with pytest.raises(SecurityScanError):
                await file_service.scan_for_viruses(infected_file, 'infected.txt')
    
    @pytest.mark.asyncio
    async def test_content_type_spoofing_detection(self):
        """Test detection of content type spoofing."""
        file_service = FileService()
        
        # Executable file claiming to be an image
        exe_content = b'\x4d\x5a'  # PE header
        
        with pytest.raises(FileValidationError):
            await file_service.validate_content_type_mismatch(
                BytesIO(exe_content), 'image.jpg', 'image/jpeg'
            )
        
        # Real image file with correct content type
        jpg_content = b'\xff\xd8\xff\xe0'  # JPEG header
        
        # Should not raise exception for legitimate files
        await file_service.validate_content_type_mismatch(
            BytesIO(jpg_content), 'photo.jpg', 'image/jpeg'
        )


class TestFileUploadPerformance:
    """Test file upload performance and scalability."""
    
    @pytest.mark.asyncio
    async def test_large_file_upload_performance(self):
        """Test performance with large file uploads."""
        file_service = FileService()
        
        # Create 10MB test file
        large_file_size = 10 * 1024 * 1024
        
        with tempfile.NamedTemporaryFile() as temp_file:
            # Write large file
            chunk_size = 1024 * 1024  # 1MB chunks
            for _ in range(10):
                temp_file.write(b'x' * chunk_size)
            temp_file.flush()
            temp_file.seek(0)
            
            start_time = datetime.now()
            
            # Mock S3 upload
            with patch.object(file_service, 'upload_to_s3') as mock_upload:
                mock_upload.return_value = {
                    'key': 'test-file.bin',
                    'etag': 'test-etag',
                    'location': 'https://s3.amazonaws.com/bucket/test-file.bin'
                }
                
                result = await file_service.upload_file(
                    temp_file, 'large_file.bin', 'application/octet-stream'
                )
            
            upload_time = datetime.now() - start_time
            
            # Should complete within reasonable time (adjust based on requirements)
            assert upload_time.total_seconds() < 30.0
            assert result['key'] == 'test-file.bin'
    
    @pytest.mark.asyncio
    async def test_concurrent_file_uploads(self):
        """Test handling concurrent file uploads."""
        file_service = FileService()
        
        async def upload_file(file_content: bytes, filename: str):
            file_obj = BytesIO(file_content)
            
            with patch.object(file_service, 'upload_to_s3') as mock_upload:
                mock_upload.return_value = {
                    'key': filename,
                    'etag': f'etag-{filename}',
                    'location': f'https://s3.amazonaws.com/bucket/{filename}'
                }
                
                return await file_service.upload_file(
                    file_obj, filename, 'text/plain'
                )
        
        # Create multiple concurrent uploads
        upload_tasks = []
        for i in range(10):
            content = f'File content {i}'.encode()
            filename = f'file_{i}.txt'
            upload_tasks.append(upload_file(content, filename))
        
        start_time = datetime.now()
        results = await asyncio.gather(*upload_tasks, return_exceptions=True)
        total_time = datetime.now() - start_time
        
        # All uploads should succeed
        for result in results:
            assert not isinstance(result, Exception)
        
        # Should handle concurrent uploads efficiently
        assert total_time.total_seconds() < 10.0
        assert len(results) == 10
    
    @pytest.mark.asyncio
    async def test_file_upload_streaming(self):
        """Test streaming file uploads for memory efficiency."""
        file_service = FileService()
        
        # Create a file that's too large to fit in memory comfortably
        large_file_size = 100 * 1024 * 1024  # 100MB
        
        class StreamingFile:
            """Mock streaming file object."""
            def __init__(self, size: int):
                self.size = size
                self.position = 0
                self.chunk_size = 1024 * 1024  # 1MB chunks
            
            async def read(self, size: int = -1) -> bytes:
                if self.position >= self.size:
                    return b''
                
                read_size = min(size if size > 0 else self.chunk_size, 
                              self.size - self.position)
                self.position += read_size
                
                # Simulate some processing time
                await asyncio.sleep(0.001)
                
                return b'x' * read_size
            
            def seek(self, position: int):
                self.position = position
        
        streaming_file = StreamingFile(large_file_size)
        
        with patch.object(file_service, 'upload_to_s3_streaming') as mock_upload:
            mock_upload.return_value = {
                'key': 'streaming-file.bin',
                'etag': 'streaming-etag',
                'location': 'https://s3.amazonaws.com/bucket/streaming-file.bin'
            }
            
            result = await file_service.upload_file_streaming(
                streaming_file, 'large_streaming_file.bin', 'application/octet-stream'
            )
        
        assert result['key'] == 'streaming-file.bin'
        mock_upload.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_file_processing_pipeline_performance(self, db_session):
        """Test performance of complete file processing pipeline."""
        file_service = FileService()
        
        # Create test data
        user = await UserFactory.create_async(db_session)
        task = await TaskFactory.create_async(db_session)
        
        # Test multiple files being processed
        files_data = [
            (b'Image content', 'image1.jpg', 'image/jpeg'),
            (b'PDF content', 'document.pdf', 'application/pdf'),  
            (b'Text content', 'notes.txt', 'text/plain'),
            (b'Spreadsheet data', 'data.csv', 'text/csv'),
        ]
        
        start_time = datetime.now()
        
        processed_files = []
        for content, filename, content_type in files_data:
            file_obj = BytesIO(content)
            
            # Mock the full pipeline
            with patch.object(file_service, 'upload_to_s3') as mock_upload, \
                 patch.object(file_service, 'scan_for_viruses') as mock_scan, \
                 patch.object(file_service, 'generate_thumbnail') as mock_thumb:
                
                mock_upload.return_value = {
                    'key': f'uploads/{filename}',
                    'etag': f'etag-{filename}',
                    'location': f'https://s3.amazonaws.com/bucket/uploads/{filename}'
                }
                mock_scan.return_value = {'status': 'clean', 'threats': []}
                mock_thumb.return_value = 'thumbnail-url'
                
                result = await file_service.process_file_upload(
                    file_obj=file_obj,
                    filename=filename,
                    content_type=content_type,
                    task_id=task.id,
                    uploaded_by=user.id
                )
                
                processed_files.append(result)
        
        processing_time = datetime.now() - start_time
        
        # Should process all files efficiently
        assert len(processed_files) == 4
        assert processing_time.total_seconds() < 5.0
        
        # Verify all files were processed correctly
        for result in processed_files:
            assert 'attachment_id' in result
            assert 'file_url' in result
            assert result['status'] == 'processed'


class TestFileUploadValidation:
    """Test comprehensive file upload validation."""
    
    @pytest.mark.asyncio
    async def test_image_file_validation(self):
        """Test image-specific validations."""
        file_service = FileService()
        
        # Valid image files
        valid_images = [
            (b'\xff\xd8\xff\xe0\x00\x10JFIF', 'photo.jpg', 'image/jpeg'),
            (b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR', 'image.png', 'image/png'),
            (b'GIF87a', 'animation.gif', 'image/gif'),
        ]
        
        for content, filename, content_type in valid_images:
            file_obj = BytesIO(content)
            
            with patch.object(file_service, 'validate_image_dimensions') as mock_validate:
                mock_validate.return_value = {'width': 800, 'height': 600}
                
                result = await file_service.validate_image_file(
                    file_obj, filename, content_type
                )
                
                assert result['is_valid'] is True
                assert 'dimensions' in result
        
        # Test dimension limits
        file_obj = BytesIO(b'\xff\xd8\xff\xe0\x00\x10JFIF')
        
        with patch.object(file_service, 'validate_image_dimensions') as mock_validate:
            # Image too large
            mock_validate.return_value = {'width': 5000, 'height': 5000}
            
            with pytest.raises(FileValidationError):
                await file_service.validate_image_file(
                    file_obj, 'huge.jpg', 'image/jpeg',
                    max_width=4000, max_height=4000
                )
    
    @pytest.mark.asyncio
    async def test_document_file_validation(self):
        """Test document-specific validations."""
        file_service = FileService()
        
        # PDF validation
        pdf_content = b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
        pdf_file = BytesIO(pdf_content)
        
        with patch.object(file_service, 'validate_pdf_structure') as mock_validate:
            mock_validate.return_value = {
                'is_valid': True,
                'page_count': 5,
                'has_metadata': True,
                'is_encrypted': False
            }
            
            result = await file_service.validate_document_file(
                pdf_file, 'document.pdf', 'application/pdf'
            )
            
            assert result['is_valid'] is True
            assert result['page_count'] == 5
        
        # Test encrypted PDF rejection
        with patch.object(file_service, 'validate_pdf_structure') as mock_validate:
            mock_validate.return_value = {
                'is_valid': True,
                'is_encrypted': True
            }
            
            with pytest.raises(FileValidationError):
                await file_service.validate_document_file(
                    pdf_file, 'encrypted.pdf', 'application/pdf'
                )
    
    @pytest.mark.asyncio
    async def test_file_hash_verification(self):
        """Test file integrity verification using hashes."""
        file_service = FileService()
        
        content = b'Test file content for hash verification'
        expected_hash = hashlib.sha256(content).hexdigest()
        
        file_obj = BytesIO(content)
        
        calculated_hash = await file_service.calculate_file_hash(file_obj)
        assert calculated_hash == expected_hash
        
        # Test hash mismatch detection
        file_obj = BytesIO(content)
        
        with pytest.raises(FileValidationError):
            await file_service.verify_file_integrity(
                file_obj, 'incorrect_hash_value'
            )


class TestS3Integration:
    """Test S3 integration for file uploads."""
    
    @pytest.mark.asyncio
    async def test_s3_upload_success(self):
        """Test successful S3 upload."""
        file_service = FileService()
        
        content = b'Test file content'
        file_obj = BytesIO(content)
        
        with patch('boto3.client') as mock_boto:
            mock_s3 = Mock()
            mock_boto.return_value = mock_s3
            
            # Mock successful upload
            mock_s3.upload_fileobj.return_value = None
            mock_s3.generate_presigned_url.return_value = 'https://s3.amazonaws.com/bucket/file.txt'
            
            result = await file_service.upload_to_s3(
                file_obj, 'test-file.txt', 'text/plain'
            )
            
            assert 'key' in result
            assert 'location' in result
            assert result['location'].startswith('https://s3.amazonaws.com')
    
    @pytest.mark.asyncio
    async def test_s3_upload_failure_handling(self):
        """Test S3 upload failure handling."""
        file_service = FileService()
        
        content = b'Test file content'
        file_obj = BytesIO(content)
        
        with patch('boto3.client') as mock_boto:
            mock_s3 = Mock()
            mock_boto.return_value = mock_s3
            
            # Mock S3 exception
            from botocore.exceptions import ClientError
            mock_s3.upload_fileobj.side_effect = ClientError(
                {'Error': {'Code': 'NoSuchBucket', 'Message': 'Bucket does not exist'}},
                'PutObject'
            )
            
            with pytest.raises(Exception):
                await file_service.upload_to_s3(
                    file_obj, 'test-file.txt', 'text/plain'
                )
    
    @pytest.mark.asyncio
    async def test_s3_presigned_url_generation(self):
        """Test S3 presigned URL generation."""
        file_service = FileService()
        
        with patch('boto3.client') as mock_boto:
            mock_s3 = Mock()
            mock_boto.return_value = mock_s3
            
            mock_s3.generate_presigned_url.return_value = (
                'https://s3.amazonaws.com/bucket/file.txt'
                '?AWSAccessKeyId=AKIA&Signature=signature&Expires=1234567890'
            )
            
            url = await file_service.generate_download_url(
                'bucket/file.txt', expiration=3600
            )
            
            assert url.startswith('https://s3.amazonaws.com')
            assert 'AWSAccessKeyId' in url
            assert 'Signature' in url
            assert 'Expires' in url


class TestFileUploadAPI:
    """Test file upload API endpoints."""
    
    @pytest.mark.asyncio
    async def test_single_file_upload_endpoint(self, authenticated_client, db_session):
        """Test single file upload API endpoint."""
        # Create test task
        task = await TaskFactory.create_async(db_session)
        
        # Prepare file upload
        file_content = b'Test file content'
        
        with patch('app.services.file_service.process_file_upload') as mock_process:
            mock_process.return_value = {
                'attachment_id': 'attachment-123',
                'file_url': 'https://s3.amazonaws.com/bucket/file.txt',
                'status': 'processed'
            }
            
            # Simulate file upload
            files = {'file': ('test.txt', BytesIO(file_content), 'text/plain')}
            data = {'task_id': str(task.id)}
            
            response = await authenticated_client.post(
                '/api/v1/attachments/upload',
                files=files,
                data=data
            )
            
            assert response.status_code == 201
            result = response.json()
            assert result['attachment_id'] == 'attachment-123'
            assert 'file_url' in result
    
    @pytest.mark.asyncio
    async def test_multiple_file_upload_endpoint(self, authenticated_client, db_session):
        """Test multiple file upload API endpoint."""
        task = await TaskFactory.create_async(db_session)
        
        # Prepare multiple files
        files_data = [
            ('file1.txt', b'Content 1', 'text/plain'),
            ('file2.txt', b'Content 2', 'text/plain'),
            ('image.jpg', b'\xff\xd8\xff\xe0', 'image/jpeg'),
        ]
        
        with patch('app.services.file_service.process_file_upload') as mock_process:
            mock_process.side_effect = [
                {'attachment_id': f'attachment-{i}', 'status': 'processed'}
                for i in range(len(files_data))
            ]
            
            files = [
                ('files', (filename, BytesIO(content), content_type))
                for filename, content, content_type in files_data
            ]
            
            response = await authenticated_client.post(
                f'/api/v1/tasks/{task.id}/attachments/bulk',
                files=files
            )
            
            assert response.status_code == 201
            result = response.json()
            assert len(result['attachments']) == 3
            assert all('attachment_id' in att for att in result['attachments'])
    
    @pytest.mark.asyncio
    async def test_file_download_endpoint(self, authenticated_client, db_session):
        """Test file download API endpoint."""
        # Create attachment
        attachment = await AttachmentFactory.create_async(db_session)
        
        with patch('app.services.file_service.generate_download_url') as mock_download:
            mock_download.return_value = 'https://s3.amazonaws.com/bucket/file.txt?signed'
            
            response = await authenticated_client.get(
                f'/api/v1/attachments/{attachment.id}/download'
            )
            
            assert response.status_code == 302  # Redirect to S3 URL
            assert response.headers['location'] == 'https://s3.amazonaws.com/bucket/file.txt?signed'
    
    @pytest.mark.asyncio
    async def test_file_upload_validation_errors(self, authenticated_client, db_session):
        """Test file upload validation error handling."""
        task = await TaskFactory.create_async(db_session)
        
        # Test file too large
        large_content = b'x' * (100 * 1024 * 1024)  # 100MB
        files = {'file': ('large.txt', BytesIO(large_content), 'text/plain')}
        
        response = await authenticated_client.post(
            '/api/v1/attachments/upload',
            files=files,
            data={'task_id': str(task.id)}
        )
        
        assert response.status_code == 413  # Payload Too Large
        
        # Test invalid file type
        malicious_content = b'\x4d\x5a'  # PE header
        files = {'file': ('virus.exe', BytesIO(malicious_content), 'application/x-executable')}
        
        response = await authenticated_client.post(
            '/api/v1/attachments/upload',
            files=files,
            data={'task_id': str(task.id)}
        )
        
        assert response.status_code == 400  # Bad Request