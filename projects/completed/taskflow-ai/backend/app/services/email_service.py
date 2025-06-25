import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
import logging
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Email service supporting both SMTP and SendGrid"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_tls = settings.SMTP_TLS
        self.from_email = settings.EMAILS_FROM_EMAIL
        self.from_name = settings.EMAILS_FROM_NAME
        self.sendgrid_api_key = settings.SENDGRID_API_KEY
        
        # Setup Jinja2 templates
        template_dir = Path(settings.EMAIL_TEMPLATES_DIR)
        if template_dir.exists():
            self.jinja_env = Environment(
                loader=FileSystemLoader(template_dir),
                autoescape=select_autoescape(['html', 'xml'])
            )
        else:
            self.jinja_env = None
            logger.warning(f"Email templates directory not found: {template_dir}")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        reply_to: Optional[str] = None,
        priority: str = "normal"
    ) -> bool:
        """Send email using configured backend"""
        
        try:
            if self.sendgrid_api_key:
                return await self._send_with_sendgrid(
                    to_email, subject, html_content, text_content, 
                    attachments, reply_to, priority
                )
            else:
                return await self._send_with_smtp(
                    to_email, subject, html_content, text_content, 
                    attachments, reply_to
                )
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    async def _send_with_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """Send email using SMTP"""
        
        if not all([self.smtp_host, self.smtp_port, self.smtp_user, self.smtp_password]):
            logger.error("SMTP configuration incomplete")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>" if self.from_name else self.from_email
            msg['To'] = to_email
            
            if reply_to:
                msg['Reply-To'] = reply_to
            
            # Add text content
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Add attachments
            if attachments:
                for attachment in attachments:
                    self._add_attachment(msg, attachment)
            
            # Send email
            context = ssl.create_default_context()
            
            if self.smtp_tls:
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls(context=context)
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context) as server:
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"SMTP error sending to {to_email}: {e}")
            return False
    
    async def _send_with_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        reply_to: Optional[str] = None,
        priority: str = "normal"
    ) -> bool:
        """Send email using SendGrid API"""
        
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
            
            sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
            
            # Create message
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content
            )
            
            # Set reply-to
            if reply_to:
                message.reply_to = reply_to
            
            # Add attachments
            if attachments:
                for attachment_data in attachments:
                    attachment = Attachment(
                        FileContent(attachment_data['content']),
                        FileName(attachment_data['filename']),
                        FileType(attachment_data['type']),
                        Disposition('attachment')
                    )
                    message.attachment = attachment
            
            # Send email
            response = sg.send(message)
            
            if response.status_code in [200, 202]:
                logger.info(f"Email sent successfully to {to_email} via SendGrid")
                return True
            else:
                logger.error(f"SendGrid error: {response.status_code} - {response.body}")
                return False
                
        except Exception as e:
            logger.error(f"SendGrid error sending to {to_email}: {e}")
            return False
    
    def _add_attachment(self, msg: MIMEMultipart, attachment: Dict[str, Any]):
        """Add attachment to email message"""
        
        try:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment['content'])
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {attachment["filename"]}'
            )
            msg.attach(part)
        except Exception as e:
            logger.error(f"Error adding attachment {attachment.get('filename', 'unknown')}: {e}")
    
    def render_template(self, template_name: str, context: Dict[str, Any]) -> tuple[str, str]:
        """Render email template with context"""
        
        if not self.jinja_env:
            raise Exception("Email templates not configured")
        
        try:
            # Render HTML template
            html_template = self.jinja_env.get_template(f"{template_name}.html")
            html_content = html_template.render(context)
            
            # Try to render text template
            text_content = None
            try:
                text_template = self.jinja_env.get_template(f"{template_name}.txt")
                text_content = text_template.render(context)
            except:
                # Generate text from HTML if no text template
                from html2text import html2text
                text_content = html2text(html_content)
            
            return html_content, text_content
            
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {e}")
            raise
    
    async def send_templated_email(
        self,
        to_email: str,
        template_name: str,
        subject: str,
        context: Dict[str, Any],
        attachments: Optional[List[Dict[str, Any]]] = None,
        reply_to: Optional[str] = None,
        priority: str = "normal"
    ) -> bool:
        """Send email using template"""
        
        try:
            # Add common context variables
            context.update({
                'frontend_url': settings.FRONTEND_URL,
                'app_name': settings.PROJECT_NAME,
                'current_year': datetime.now().year,
                'support_email': self.from_email
            })
            
            # Render template
            html_content, text_content = self.render_template(template_name, context)
            
            # Send email
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                attachments=attachments,
                reply_to=reply_to,
                priority=priority
            )
            
        except Exception as e:
            logger.error(f"Error sending templated email to {to_email}: {e}")
            return False


# Global email service instance
email_service = EmailService()


# Convenience functions for common email types
async def send_team_invitation_email(
    email: str,
    team_name: str,
    invited_by_name: str,
    invitation_token: str,
    custom_message: Optional[str] = None
) -> bool:
    """Send team invitation email"""
    
    context = {
        'team_name': team_name,
        'invited_by_name': invited_by_name,
        'invitation_url': f"{settings.FRONTEND_URL}/invite/accept/{invitation_token}",
        'custom_message': custom_message,
        'expires_days': 7
    }
    
    return await email_service.send_templated_email(
        to_email=email,
        template_name="team_invitation",
        subject=f"You're invited to join {team_name} on {settings.PROJECT_NAME}",
        context=context,
        priority="high"
    )


async def send_task_assignment_email(
    email: str,
    assignee_name: str,
    task_title: str,
    task_description: str,
    assigned_by_name: str,
    team_name: str,
    task_id: str,
    due_date: Optional[datetime] = None
) -> bool:
    """Send task assignment notification email"""
    
    context = {
        'assignee_name': assignee_name,
        'task_title': task_title,
        'task_description': task_description,
        'assigned_by_name': assigned_by_name,
        'team_name': team_name,
        'task_url': f"{settings.FRONTEND_URL}/tasks/{task_id}",
        'due_date': due_date.strftime("%B %d, %Y") if due_date else None
    }
    
    return await email_service.send_templated_email(
        to_email=email,
        template_name="task_assignment",
        subject=f"New task assigned: {task_title}",
        context=context,
        priority="normal"
    )


async def send_mention_notification_email(
    email: str,
    mentioned_by_name: str,
    content: str,
    context_type: str,  # task, comment, project
    context_title: str,
    context_url: str,
    team_name: str
) -> bool:
    """Send @mention notification email"""
    
    context = {
        'mentioned_by_name': mentioned_by_name,
        'content': content,
        'context_type': context_type,
        'context_title': context_title,
        'context_url': context_url,
        'team_name': team_name
    }
    
    return await email_service.send_templated_email(
        to_email=email,
        template_name="mention_notification",
        subject=f"{mentioned_by_name} mentioned you in {context_type}",
        context=context,
        priority="normal"
    )


async def send_welcome_email(
    email: str,
    user_name: str,
    verification_token: Optional[str] = None
) -> bool:
    """Send welcome email to new users"""
    
    context = {
        'user_name': user_name,
        'verification_url': f"{settings.FRONTEND_URL}/verify/{verification_token}" if verification_token else None,
        'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
        'getting_started_url': f"{settings.FRONTEND_URL}/getting-started"
    }
    
    return await email_service.send_templated_email(
        to_email=email,
        template_name="welcome",
        subject=f"Welcome to {settings.PROJECT_NAME}!",
        context=context,
        priority="normal"
    )


async def send_password_reset_email(
    email: str,
    user_name: str,
    reset_token: str
) -> bool:
    """Send password reset email"""
    
    context = {
        'user_name': user_name,
        'reset_url': f"{settings.FRONTEND_URL}/reset-password/{reset_token}",
        'expires_hours': 24
    }
    
    return await email_service.send_templated_email(
        to_email=email,
        template_name="password_reset",
        subject=f"Reset your {settings.PROJECT_NAME} password",
        context=context,
        priority="high"
    )


async def send_digest_email(
    email: str,
    user_name: str,
    digest_data: Dict[str, Any],
    frequency: str = "daily"
) -> bool:
    """Send notification digest email"""
    
    context = {
        'user_name': user_name,
        'frequency': frequency,
        'digest_data': digest_data,
        'unsubscribe_url': f"{settings.FRONTEND_URL}/unsubscribe/{digest_data.get('unsubscribe_token', '')}",
        'preferences_url': f"{settings.FRONTEND_URL}/settings/notifications"
    }
    
    return await email_service.send_templated_email(
        to_email=email,
        template_name="notification_digest",
        subject=f"Your {frequency} {settings.PROJECT_NAME} digest",
        context=context,
        priority="low"
    )