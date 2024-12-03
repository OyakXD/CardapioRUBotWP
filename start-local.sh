if [[ -d .git ]]; then
  LOCAL_HASH=$(git rev-parse HEAD)
  REMOTE_HASH=$(git ls-remote origin HEAD | awk '{print $1}')
  
  if [[ "$LOCAL_HASH" != "$REMOTE_HASH" ]]; then
    echo "Atualizações detectadas no repositório remoto. Realizando pull..."
    git reset --hard HEAD && git pull

    if [[ ! -z ${NODE_PACKAGES} ]]; then
      /usr/local/bin/npm install ${NODE_PACKAGES}
    fi

    if [[ ! -z ${UNNODE_PACKAGES} ]]; then
      /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}
    fi

    if [[ -f /home/container/package.json ]]; then
      /usr/local/bin/npm install
    fi

    /usr/local/bin/npm run build
  else
    echo "Nenhuma atualização detectada. Continuando..."
  fi
fi

/usr/local/bin/npm run start
