pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
        DOCKER_IMAGE = 'klodit/ao-service'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint & Formatting') {
            steps {
                sh 'npm run lint'
                sh 'npm run format:check || true'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test -- --passWithNoTests'
                // uncomment for e2e tests 
                // sh 'npm run test:e2e'
            }
        }

        stage('Build Artifact') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${env.BUILD_ID}")
                }
            }
        }

        stage('Docker Push (Optional)') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Requires docker hub credentials configured in Jenkins
                    // docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                    //     docker.image("${DOCKER_IMAGE}:${env.BUILD_ID}").push()
                    //     docker.image("${DOCKER_IMAGE}:latest").push()
                    // }
                    echo "Would push to Docker Hub here."
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
