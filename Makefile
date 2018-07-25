SHELL       = /bin/bash -o pipefail
PWD        := $(shell pwd)

PROJECT    := $(shell basename `git remote get-url origin` .git)
BUILD_DIR  := $(PWD)/build

ZIP        := zip
NPM        := yarn
NPM_RUN    := $(NPM) run

.PHONY: develop build

develop:
	$(NPM_RUN) start

build:
	NODE_ENV=production $(NPM_RUN) build
	cd $(BUILD_DIR); $(ZIP) $(PROJECT).zip *
