from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User, AIAgent
from datetime import datetime

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for AI services"""
    try:
        # Count active agents
        active_agents = AIAgent.query.filter_by(status='active').count()
        
        return jsonify({
            'service': 'omnara',
            'status': 'limited',  # Simulation mode
            'api_key_configured': False,
            'active_agents': active_agents,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Health check failed', 'details': str(e)}), 500

@ai_bp.route('/agents', methods=['POST'])
@jwt_required()
def create_agent():
    """Create a new AI agent"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        agent_type = data.get('agent_type', 'trading-analyst')
        
        # Create new agent
        agent = AIAgent(
            user_id=current_user_id,
            agent_type=agent_type,
            status='active'
        )
        
        db.session.add(agent)
        db.session.commit()
        
        return jsonify({
            'message': 'Agent created successfully',
            'instance_id': agent.instance_id,
            'agent_type': agent.agent_type,
            'status': agent.status
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create agent', 'details': str(e)}), 500

@ai_bp.route('/agents', methods=['GET'])
@jwt_required()
def get_agents():
    """Get all agents for the current user"""
    try:
        current_user_id = get_jwt_identity()
        agents = AIAgent.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'agents': [agent.to_dict() for agent in agents],
            'count': len(agents)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get agents', 'details': str(e)}), 500

@ai_bp.route('/agents/<agent_id>', methods=['GET'])
@jwt_required()
def get_agent(agent_id):
    """Get a specific agent"""
    try:
        current_user_id = get_jwt_identity()
        agent = AIAgent.query.filter_by(
            instance_id=agent_id,
            user_id=current_user_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        return jsonify({'agent': agent.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get agent', 'details': str(e)}), 500

@ai_bp.route('/agents/<agent_id>/message', methods=['POST'])
@jwt_required()
def send_message_to_agent(agent_id):
    """Send a message to an AI agent"""
    try:
        current_user_id = get_jwt_identity()
        agent = AIAgent.query.filter_by(
            instance_id=agent_id,
            user_id=current_user_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Simulate AI response (since Omnara is not configured)
        response = {
            'message': 'Omnara client not configured',
            'status': 'simulated',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'message': 'Message sent successfully',
            'response': response
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to send message', 'details': str(e)}), 500

@ai_bp.route('/agents/<agent_id>', methods=['DELETE'])
@jwt_required()
def delete_agent(agent_id):
    """Delete an AI agent"""
    try:
        current_user_id = get_jwt_identity()
        agent = AIAgent.query.filter_by(
            instance_id=agent_id,
            user_id=current_user_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        db.session.delete(agent)
        db.session.commit()
        
        return jsonify({'message': 'Agent deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete agent', 'details': str(e)}), 500
