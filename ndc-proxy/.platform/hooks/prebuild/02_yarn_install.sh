#!/usr/bin/bash
PATH="$PATH:$(dirname $(readlink $(which node)))"
yarn --production install
