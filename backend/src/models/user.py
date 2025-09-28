from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with AI agents
    agents = db.relationship('AIAgent', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.email}>'

    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        """Check if the provided password matches the user's password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'email_verified': self.email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AIAgent(db.Model):
    instance_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    agent_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<AIAgent {self.instance_id}>'

    def to_dict(self):
        return {
            'instance_id': self.instance_id,
            'agent_type': self.agent_type,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
