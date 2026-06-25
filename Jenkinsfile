pipeline {
    agent any

    environment {
        // Name of the Docker image to build
        IMAGE_NAME = 'react-example-app'
        // Port the application will run on
        APP_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout the source code from Git
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // For Windows agents use 'bat' or 'powershell' instead of 'sh'
                // If using a Windows Jenkins server, change 'sh' to 'bat' or 'powershell'
                script {
                    if (isUnix()) {
                        sh 'npm install'
                    } else {
                        bat 'npm install'
                    }
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm run build'
                    } else {
                        bat 'npm run build'
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    if (isUnix()) {
                        sh "docker build -t ${IMAGE_NAME} ."
                    } else {
                        bat "docker build -t ${IMAGE_NAME} ."
                    }
                }
            }
        }

        stage('Docker Deploy') {
            steps {
                script {
                    if (isUnix()) {
                        // Stop and remove old container if it exists
                        sh """
                        docker rm -f react-app-container || true
                        docker run -d --name react-app-container -p ${APP_PORT}:3000 ${IMAGE_NAME}
                        """
                    } else {
                        // Windows deployment logic
                        powershell """
                        docker rm -f react-app-container 2> \$null
                        docker run -d --name react-app-container -p ${APP_PORT}:3000 ${IMAGE_NAME}
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "Pipeline finished."
        }
        success {
            echo "Deployment successful! App is running."
        }
        failure {
            echo "Pipeline failed. Please check the logs."
        }
    }
}
