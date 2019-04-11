job('forex-build') {
    triggers {
        bitbucketPush()
    }

    scm {
        git {
            remote {
                name('origin')
                url('git@bitbucket.org:danielepolencic/forex.git')
                credentials('2e36373e-e741-4a4c-aaf6-d866330ad005')
            }
            branch('master')
        }
    }

    steps {
      shell "docker build -t forex:\${BUILD_NUMBER} -f build/App.Dockerfile ."

      downstreamParameterized {
          trigger('forex-ci') {
              parameters {
                  predefinedProp('BUILD_ID', "\${BUILD_NUMBER}")
              }
          }
      }

    }
}

job('forex-ci') {
    parameters {
        stringParam('BUILD_ID')
    }

    scm {
        git {
            remote {
                name('origin')
                url('git@bitbucket.org:danielepolencic/forex.git')
                credentials('2e36373e-e741-4a4c-aaf6-d866330ad005')
            }
            branch('master')
        }
    }

    steps {
        shell """export NODE_ENV=ci
                 |docker-compose stop
                 |docker-compose up -d""".stripMargin()
    }

    properties {
          promotions {
              promotion {
                  name('prod')
                  icon('star-yellow')

                  conditions {
                      manual('')
                  }

                  actions {
                    downstreamParameterized {
                        trigger('forex-prod') {
                            parameters {
                                predefinedProp('BUILD_ID', "\${BUILD_ID}")
                            }
                        }
                    }
                  }
              }
          }
      }
}

job('forex-prod') {
    parameters {
        stringParam('BUILD_ID')
    }

    scm {
        git {
            remote {
                name('origin')
                url('git@bitbucket.org:danielepolencic/forex.git')
                credentials('2e36373e-e741-4a4c-aaf6-d866330ad005')
            }
            branch('master')
        }
    }

    steps {
        shell """export NODE_ENV=live
                 |docker-compose stop
                 |docker-compose up -d""".stripMargin()
    }
}

job('forex-admin') {
    triggers {
        cron('@daily')
    }

    steps {
        shell "docker rmi \$(docker images forex --format \"{{.Tag}}-{{.ID}}\" | sed '/prod/d' | sed '/ci/d' | sort -r | tail -n +11 | cut -d'-' -f 2) || :"
    }
}
