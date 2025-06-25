#!/usr/bin/env python3
"""
Comprehensive test runner for Wave 2 features
Orchestrates all test suites and generates coverage reports
"""
import asyncio
import subprocess
import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Any
import json
import argparse


class TestRunner:
    """Orchestrates comprehensive testing for Wave 2 features."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.results = {}
        self.start_time = None
        self.coverage_threshold = config.get('coverage_threshold', 85)
        
    async def run_all_tests(self):
        """Run all test suites in sequence."""
        self.start_time = time.time()
        
        print("🧪 Starting Comprehensive Wave 2 Testing Suite")
        print("=" * 60)
        
        # Test suites to run
        test_suites = [
            ("Unit Tests", self.run_unit_tests),
            ("Team Collaboration Tests", self.run_team_collaboration_tests),
            ("Analytics Tests", self.run_analytics_tests),
            ("File Upload Tests", self.run_file_upload_tests),
            ("Email Tests", self.run_email_tests),
            ("WebSocket Tests", self.run_websocket_tests),
            ("Integration Tests", self.run_integration_tests),
            ("Load Tests", self.run_load_tests),
        ]
        
        for suite_name, test_function in test_suites:
            print(f"\n📋 Running {suite_name}...")
            try:
                result = await test_function()
                self.results[suite_name] = result
                if result['success']:
                    print(f"✅ {suite_name} PASSED")
                else:
                    print(f"❌ {suite_name} FAILED")
            except Exception as e:
                print(f"💥 {suite_name} ERROR: {str(e)}")
                self.results[suite_name] = {'success': False, 'error': str(e)}
        
        # Generate coverage report
        await self.generate_coverage_report()
        
        # Generate final report
        await self.generate_final_report()
        
    async def run_unit_tests(self) -> Dict[str, Any]:
        """Run basic unit tests."""
        try:
            result = subprocess.run([
                'pytest', 
                'tests/test_auth.py',
                'tests/test_task_endpoints.py',
                'tests/test_config.py',
                '-v',
                '--tb=short'
            ], capture_output=True, text=True, cwd='.')
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'errors': result.stderr,
                'duration': time.time() - self.start_time
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def run_team_collaboration_tests(self) -> Dict[str, Any]:
        """Run team collaboration test suite."""
        try:
            result = subprocess.run([
                'pytest',
                'tests/test_team_collaboration.py',
                '-v',
                '--tb=short',
                '--maxfail=5'
            ], capture_output=True, text=True, cwd='.')
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'errors': result.stderr,
                'test_count': self.count_tests_in_output(result.stdout),
                'duration': time.time() - self.start_time
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def run_analytics_tests(self) -> Dict[str, Any]:
        """Run analytics test suite."""
        try:
            result = subprocess.run([
                'pytest',
                'tests/test_analytics.py',
                '-v',
                '--tb=short',
                '-m', 'not slow'  # Skip slow tests in regular run
            ], capture_output=True, text=True, cwd='.')
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'errors': result.stderr,
                'test_count': self.count_tests_in_output(result.stdout),
                'duration': time.time() - self.start_time
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def run_file_upload_tests(self) -> Dict[str, Any]:
        """Run file upload test suite."""
        try:
            result = subprocess.run([
                'pytest',
                'tests/test_file_upload.py',
                '-v',
                '--tb=short'
            ], capture_output=True, text=True, cwd='.')
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'errors': result.stderr,
                'test_count': self.count_tests_in_output(result.stdout),
                'duration': time.time() - self.start_time
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def run_email_tests(self) -> Dict[str, Any]:
        """Run email service test suite."""
        # Check if MailHog is running
        mailhog_status = await self.check_mailhog_status()
        
        try:
            cmd = [
                'pytest',
                'tests/test_email_service.py',
                '-v',
                '--tb=short'
            ]
            
            if not mailhog_status:
                print("⚠️  MailHog not running, skipping integration email tests")
                cmd.extend(['-m', 'not integration'])
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'errors': result.stderr,
                'mailhog_available': mailhog_status,
                'test_count': self.count_tests_in_output(result.stdout),
                'duration': time.time() - self.start_time
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def run_websocket_tests(self) -> Dict[str, Any]:
        """Run WebSocket test suite."""
        try:
            result = subprocess.run([
                'pytest',
                'tests/test_websocket_realtime.py',
                '-v',
                '--tb=short'
            ], capture_output=True, text=True, cwd='.')
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'errors': result.stderr,
                'test_count': self.count_tests_in_output(result.stdout),
                'duration': time.time() - self.start_time
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def run_integration_tests(self) -> Dict[str, Any]:
        """Run integration test suite."""
        try:
            result = subprocess.run([
                'pytest',
                'tests/test_integration.py',
                '-v',
                '--tb=short',
                '-m', 'integration'
            ], capture_output=True, text=True, cwd='.')
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'errors': result.stderr,
                'test_count': self.count_tests_in_output(result.stdout),
                'duration': time.time() - self.start_time
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def run_load_tests(self) -> Dict[str, Any]:
        """Run load test suite."""
        if not self.config.get('run_load_tests', False):
            return {
                'success': True,
                'skipped': True,
                'reason': 'Load tests skipped (use --load to enable)'
            }
        
        try:
            # Run a quick load test
            result = subprocess.run([
                'locust',
                '-f', 'tests/test_load_wave2.py',
                '--headless',
                '-u', '10',  # 10 users
                '-r', '2',   # 2 users per second
                '-t', '30s', # 30 seconds
                '--host', 'http://localhost:8000'
            ], capture_output=True, text=True, cwd='.')
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'errors': result.stderr,
                'duration': time.time() - self.start_time
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def generate_coverage_report(self):
        """Generate comprehensive coverage report."""
        print("\n📊 Generating Coverage Report...")
        
        try:
            # Run pytest with coverage
            result = subprocess.run([
                'pytest',
                '--cov=app',
                '--cov-report=html',
                '--cov-report=xml',
                '--cov-report=term-missing',
                '--cov-fail-under=' + str(self.coverage_threshold),
                'tests/'
            ], capture_output=True, text=True, cwd='.')
            
            coverage_success = result.returncode == 0
            
            # Extract coverage percentage
            coverage_percentage = self.extract_coverage_percentage(result.stdout)
            
            self.results['Coverage'] = {
                'success': coverage_success,
                'percentage': coverage_percentage,
                'threshold': self.coverage_threshold,
                'output': result.stdout,
                'errors': result.stderr
            }
            
            if coverage_success:
                print(f"✅ Coverage: {coverage_percentage}% (threshold: {self.coverage_threshold}%)")
            else:
                print(f"❌ Coverage: {coverage_percentage}% (below threshold: {self.coverage_threshold}%)")
                
        except Exception as e:
            print(f"💥 Coverage generation failed: {str(e)}")
            self.results['Coverage'] = {'success': False, 'error': str(e)}
    
    async def generate_final_report(self):
        """Generate final test report."""
        total_time = time.time() - self.start_time
        
        print("\n" + "=" * 60)
        print("📈 FINAL TEST REPORT")
        print("=" * 60)
        
        # Summary statistics
        total_suites = len(self.results)
        passed_suites = sum(1 for result in self.results.values() if result.get('success', False))
        failed_suites = total_suites - passed_suites
        
        print(f"🎯 Test Suites: {passed_suites}/{total_suites} passed")
        print(f"⏱️  Total Time: {total_time:.2f} seconds")
        
        # Detailed results
        print("\n📋 Detailed Results:")
        for suite_name, result in self.results.items():
            status = "✅ PASS" if result.get('success', False) else "❌ FAIL"
            if result.get('skipped'):
                status = "⏭️  SKIP"
            
            test_count = result.get('test_count', 'N/A')
            duration = result.get('duration', 0)
            
            print(f"  {suite_name:<30} {status} ({test_count} tests, {duration:.1f}s)")
            
            if result.get('error'):
                print(f"    Error: {result['error']}")
        
        # Coverage report
        if 'Coverage' in self.results:
            coverage_result = self.results['Coverage']
            if coverage_result.get('success'):
                print(f"\n📊 Code Coverage: {coverage_result.get('percentage', 'N/A')}%")
            else:
                print(f"\n📊 Code Coverage: FAILED")
        
        # Save results to file
        report_data = {
            'timestamp': time.time(),
            'duration': total_time,
            'summary': {
                'total_suites': total_suites,
                'passed_suites': passed_suites,
                'failed_suites': failed_suites,
                'success_rate': (passed_suites / total_suites) * 100 if total_suites > 0 else 0
            },
            'results': self.results
        }
        
        with open('test_report.json', 'w') as f:
            json.dump(report_data, f, indent=2, default=str)
        
        print(f"\n💾 Full report saved to: test_report.json")
        print(f"📁 Coverage report available at: htmlcov/index.html")
        
        # Exit with error code if any tests failed
        if failed_suites > 0:
            print(f"\n❌ {failed_suites} test suite(s) failed!")
            sys.exit(1)
        else:
            print(f"\n🎉 All test suites passed!")
    
    async def check_mailhog_status(self) -> bool:
        """Check if MailHog is running."""
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:8025/api/v2/messages') as response:
                    return response.status == 200
        except:
            return False
    
    def count_tests_in_output(self, output: str) -> int:
        """Count number of tests from pytest output."""
        lines = output.split('\n')
        for line in lines:
            if ' passed' in line or ' failed' in line:
                # Extract number from lines like "10 passed, 2 failed"
                import re
                numbers = re.findall(r'(\d+) (?:passed|failed|skipped)', line)
                return sum(int(n) for n in numbers)
        return 0
    
    def extract_coverage_percentage(self, output: str) -> float:
        """Extract coverage percentage from pytest output."""
        lines = output.split('\n')
        for line in lines:
            if 'TOTAL' in line and '%' in line:
                # Extract percentage from line like "TOTAL  1234   456    89%"
                import re
                match = re.search(r'(\d+)%', line)
                if match:
                    return float(match.group(1))
        return 0.0


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Run comprehensive Wave 2 tests')
    parser.add_argument('--load', action='store_true', help='Include load tests')
    parser.add_argument('--coverage', type=int, default=85, help='Coverage threshold (default: 85)')
    parser.add_argument('--fast', action='store_true', help='Skip slow tests')
    parser.add_argument('--suite', choices=[
        'unit', 'team', 'analytics', 'files', 'email', 'websocket', 'integration', 'load'
    ], help='Run specific test suite only')
    
    args = parser.parse_args()
    
    config = {
        'run_load_tests': args.load,
        'coverage_threshold': args.coverage,
        'fast_mode': args.fast,
        'specific_suite': args.suite
    }
    
    runner = TestRunner(config)
    
    # Check if running in CI environment
    if os.getenv('CI'):
        print("🤖 Running in CI environment")
        config['run_load_tests'] = False  # Skip load tests in CI
    
    if args.suite:
        # Run specific suite only
        suite_map = {
            'unit': runner.run_unit_tests,
            'team': runner.run_team_collaboration_tests,
            'analytics': runner.run_analytics_tests,
            'files': runner.run_file_upload_tests,
            'email': runner.run_email_tests,
            'websocket': runner.run_websocket_tests,
            'integration': runner.run_integration_tests,
            'load': runner.run_load_tests
        }
        
        if args.suite in suite_map:
            print(f"🎯 Running {args.suite} tests only...")
            runner.start_time = time.time()
            result = await suite_map[args.suite]()
            if result['success']:
                print(f"✅ {args.suite} tests PASSED")
            else:
                print(f"❌ {args.suite} tests FAILED")
                sys.exit(1)
    else:
        # Run all tests
        await runner.run_all_tests()


if __name__ == '__main__':
    asyncio.run(main())