#!/usr/bin/env python3
"""
Backend server runner with enhanced error handling and logging
"""
import os
import sys
import traceback
from flask import Flask
from flask_cors import CORS

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"])
    
    # Import and register routes
    try:
        from app import app as main_app
        return main_app
    except ImportError as e:
        print(f"Error importing app: {e}")
        print("Make sure all dependencies are installed:")
        print("pip install -r requirements.txt")
        sys.exit(1)

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ['MISTRAL_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("Warning: Missing environment variables:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nCreate a .env file with these variables for full functionality.")
        print("The app will still run with limited features.")

def main():
    """Main function to run the Flask application"""
    print("🚀 Starting AI Interviewer Backend Server...")
    
    # Check environment
    check_environment()
    
    try:
        # Create Flask app
        app = create_app()
        
        # Get port from environment or use default
        port = int(os.environ.get('PORT', 5000))
        host = os.environ.get('HOST', '127.0.0.1')
        
        print(f"📡 Backend server starting on http://{host}:{port}")
        print("🔗 Frontend should connect to this URL")
        print("📝 API endpoints available:")
        print("   - GET  /health")
        print("   - POST /save-personal-info")
        print("   - POST /submit-response")
        print("   - POST /generate_question")
        print("   - POST /tts")
        print("   - POST /stt")
        print("   - POST /job_description")
        print("   - POST /evaluate_all_answer")
        print("\n✅ Server ready! Waiting for connections...")
        
        # Run the app
        app.run(
            host=host,
            port=port,
            debug=True,
            threaded=True
        )
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        print(f"📋 Full error: {traceback.format_exc()}")
        sys.exit(1)

if __name__ == '__main__':
    main()