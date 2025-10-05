from flask import Blueprint, request, jsonify
import uuid
import time
from datetime import datetime

api_bp = Blueprint('api', __name__)

# In-memory storage for demo purposes
users = {}
sessions = {}
scans = {}

@api_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        if email in users:
            return jsonify({'error': 'User already exists'}), 409

        user_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        users[email] = {
            'id': user_id,
            'name': name or email.split('@')[0],
            'email': email,
            'password': password,
            'createdAt': datetime.now().isoformat()
        }

        sessions[session_id] = {
            'userId': user_id,
            'email': email,
            'createdAt': datetime.now().isoformat()
        }

        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'name': users[email]['name'],
                'email': email
            },
            'sessionId': session_id,
            'message': 'User registered successfully'
        })

    except Exception as e:
        return jsonify({'error': 'Registration failed', 'message': str(e)}), 500

@api_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        if email not in users or users[email]['password'] != password:
            return jsonify({'error': 'Invalid credentials'}), 401

        session_id = str(uuid.uuid4())
        user = users[email]

        sessions[session_id] = {
            'userId': user['id'],
            'email': email,
            'createdAt': datetime.now().isoformat()
        }

        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': email
            },
            'sessionId': session_id,
            'message': 'Login successful'
        })

    except Exception as e:
        return jsonify({'error': 'Login failed', 'message': str(e)}), 500

@api_bp.route('/auth/logout', methods=['POST'])
def logout():
    try:
        data = request.get_json()
        session_id = data.get('sessionId')

        if session_id and session_id in sessions:
            del sessions[session_id]

        return jsonify({
            'success': True,
            'message': 'Logout successful'
        })

    except Exception as e:
        return jsonify({'error': 'Logout failed', 'message': str(e)}), 500

@api_bp.route('/auth/profile/<session_id>', methods=['GET'])
def profile(session_id):
    try:
        if session_id not in sessions:
            return jsonify({'error': 'Invalid session'}), 401

        session = sessions[session_id]
        email = session['email']
        
        if email not in users:
            return jsonify({'error': 'User not found'}), 404

        user = users[email]
        return jsonify({
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'createdAt': user['createdAt']
            }
        })

    except Exception as e:
        return jsonify({'error': 'Failed to get profile', 'message': str(e)}), 500

@api_bp.route('/scan/start', methods=['POST'])
def start_scan():
    try:
        data = request.get_json()
        repo_url = data.get('repoUrl')
        scan_types = data.get('scanTypes', ['semgrep', 'trivy'])

        if not repo_url:
            return jsonify({'error': 'Repository URL is required'}), 400

        scan_id = str(uuid.uuid4())
        
        scans[scan_id] = {
            'id': scan_id,
            'repoUrl': repo_url,
            'scanTypes': scan_types,
            'status': 'started',
            'progress': 0,
            'results': {},
            'startTime': datetime.now().isoformat()
        }

        # Simulate scan progress
        import threading
        def simulate_scan():
            time.sleep(2)
            scans[scan_id]['status'] = 'scanning'
            scans[scan_id]['progress'] = 30
            
            time.sleep(3)
            scans[scan_id]['progress'] = 70
            
            time.sleep(2)
            scans[scan_id]['status'] = 'completed'
            scans[scan_id]['progress'] = 100
            scans[scan_id]['endTime'] = datetime.now().isoformat()
            scans[scan_id]['results'] = {
                'semgrep': {
                    'findings': [
                        {
                            'rule_id': 'javascript.lang.security.audit.xss.direct-response-write',
                            'severity': 'WARNING',
                            'message': 'Potential XSS vulnerability detected',
                            'path': 'src/app.js',
                            'line': 42,
                            'confidence': 'HIGH'
                        }
                    ],
                    'summary': {'total': 1, 'high': 0, 'medium': 1, 'low': 0}
                },
                'trivy': {
                    'vulnerabilities': [
                        {
                            'VulnerabilityID': 'CVE-2021-44228',
                            'PkgName': 'log4j-core',
                            'InstalledVersion': '2.14.1',
                            'FixedVersion': '2.15.0',
                            'Severity': 'CRITICAL',
                            'Title': 'Apache Log4j2 JNDI features vulnerability'
                        }
                    ],
                    'summary': {'total': 1, 'critical': 1, 'high': 0, 'medium': 0, 'low': 0}
                }
            }
            scans[scan_id]['securityScore'] = {
                'score': 65,
                'grade': 'C',
                'timestamp': datetime.now().isoformat()
            }

        thread = threading.Thread(target=simulate_scan)
        thread.daemon = True
        thread.start()

        return jsonify({
            'scanId': scan_id,
            'status': 'started',
            'message': 'Scan initiated successfully'
        })

    except Exception as e:
        return jsonify({'error': 'Failed to start scan', 'message': str(e)}), 500

@api_bp.route('/scan/status/<scan_id>', methods=['GET'])
def scan_status(scan_id):
    try:
        if scan_id not in scans:
            return jsonify({'error': 'Scan not found'}), 404

        return jsonify(scans[scan_id])

    except Exception as e:
        return jsonify({'error': 'Failed to get scan status', 'message': str(e)}), 500

@api_bp.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })
