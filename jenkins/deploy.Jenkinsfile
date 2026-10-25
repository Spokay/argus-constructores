// Deploiement d'une image deja construite par GitHub Actions et poussee sur registry.spokayhub.top.
// A placer dans le repo de l'app (jenkins/deploy.Jenkinsfile), a cote de docker-compose.prod.yaml.
pipeline {
  agent { label 'ssh-agent' }
  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }
  parameters {
    string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Tag de l\'image a deployer (sha, version, latest)')
  }
  environment {
    APP      = 'argus-constructores'   // = nom du projet compose. Ne jamais le changer (volumes prefixes par lui).
    REGISTRY = 'registry.spokayhub.top'
  }
  stages {
    stage('Pull') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'registry-spokayhub',
                                          usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS'),
                         file(credentialsId: "${APP}-env", variable: 'ENV_FILE')]) {
          sh '''
            export DOCKER_CONFIG="$WORKSPACE@tmp/docker"   # login isole, rien dans ~/.docker
            export VERSION="$IMAGE_TAG"
            compose() { docker compose -p "$APP" -f docker-compose.prod.yaml --env-file "$ENV_FILE" "$@"; }
            echo "$REG_PASS" | docker login "$REGISTRY" -u "$REG_USER" --password-stdin
            compose config -q
            compose pull
            docker logout "$REGISTRY"
          '''
        }
      }
    }
    stage('Deploy') {
      steps {
        withCredentials([file(credentialsId: "${APP}-env", variable: 'ENV_FILE')]) {
          sh '''
            export VERSION="$IMAGE_TAG"
            docker compose -p "$APP" -f docker-compose.prod.yaml --env-file "$ENV_FILE" \
              up -d --remove-orphans --wait --wait-timeout 180
            docker compose -p "$APP" -f docker-compose.prod.yaml --env-file "$ENV_FILE" ps
          '''
        }
      }
    }
  }
  post {
    success { echo "Deploye : ${env.APP} @ ${params.IMAGE_TAG}" }
    always  { cleanWs() }
  }
}
