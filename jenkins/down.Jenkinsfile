// Arret du service d'une app deployee par deploy.Jenkinsfile.
// A placer dans le repo de l'app (jenkins/down.Jenkinsfile).
pipeline {
  agent { label 'ssh-agent' }
  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }
  parameters {
    booleanParam(name: 'REMOVE_VOLUMES', defaultValue: false,
                 description: 'Supprimer aussi les volumes nommes (DONNEES PERDUES, irreversible)')
  }
  environment {
    APP = 'argus-constructores'   // meme valeur que dans deploy.Jenkinsfile
  }
  stages {
    stage('Confirm volumes') {
      when { expression { params.REMOVE_VOLUMES } }
      steps {
        input message: "Supprimer DEFINITIVEMENT les volumes du projet ${env.APP} ?", ok: 'Supprimer'
      }
    }
    stage('Down') {
      steps {
        withCredentials([file(credentialsId: "${APP}-env", variable: 'ENV_FILE')]) {
          sh '''
            set -- --remove-orphans
            [ "$REMOVE_VOLUMES" = "true" ] && set -- "$@" --volumes
            docker compose -p "$APP" -f docker-compose.prod.yaml --env-file "$ENV_FILE" down "$@"
          '''
        }
      }
    }
  }
  post {
    always { cleanWs() }
  }
}
