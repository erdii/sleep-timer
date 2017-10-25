.PHONY: release
release: | clean build dist

.PHONY: build
build: | build-ts build-css

.PHONY: build-ts
build-ts: | node_modules shared
	node_modules/.bin/tsc

.PHONY: build-css
build-css: | node_modules shared
	node_modules/.bin/lessc src/styles/index.less build/index.css

.PHONY: watch
watch:
	yarn run watch

.PHONY: watch-ts
watch-ts: shared
	node_modules/.bin/tsc -w

.PHONY: watch-css
watch-css: shared
	PATH="$(PATH):node_modules/.bin" less-watch-compiler src/styles build index.less

.PHONY: start
start:
	yarn run start

.PHONY: clean
clean:
	rm -rf build || true
	rm -rf node_modules || true
	rm -rf dist || true

node_modules:
	yarn

.PHONY: shared
shared:
	mkdir build || true
	cp src/index.html build/index.html

.PHONY: dist
dist: dist-linux dist-mac dist-win

# bug!
# https://github.com/electron-userland/electron-builder/issues/993
# install libisoburn
# USE_SYSTEM_XORRISO=true make dist-linux
.PHONY: dist-linux
dist-linux:
	yarn run dist-linux

.PHONY: dist-mac
dist-mac:
	yarn run dist-mac

.PHONY: dist-win
dist-win:
	yarn run dist-win
