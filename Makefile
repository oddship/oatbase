DIST := dist
ESGUN_DIST := dist-esgun
ESGUN ?= esgun

.PHONY: all dist dist-esgun verify-esgun test test-all clean

all: dist

dist:
	@mkdir -p $(DIST)
	bun build src/css/extensions.css --outfile $(DIST)/extensions.css
	bun build src/css/extensions.css --minify --outfile $(DIST)/extensions.min.css
	bun scripts/build-full-css.js
	bun build src/js/index.js --format=iife --outfile $(DIST)/oatbase.js
	bun build src/js/index.js --format=iife --minify --outfile $(DIST)/oatbase.min.js
	bun build src/js/index.js --format=esm --outfile $(DIST)/oatbase.esm.js
	bun build src/js/extensions.js --format=iife --outfile $(DIST)/extensions.js
	bun build src/js/extensions.js --format=iife --minify --outfile $(DIST)/extensions.min.js
	bun build src/js/extensions.js --format=esm --outfile $(DIST)/extensions.esm.js
	bun build src/css/components/combobox.css --outfile $(DIST)/combobox.css
	bun build src/js/combobox.js --format=iife --outfile $(DIST)/combobox.js
	bun build src/js/combobox.js --format=esm --outfile $(DIST)/combobox.esm.js
	bun build src/css/components/command.css --outfile $(DIST)/command.css
	bun build src/js/command.js --format=iife --outfile $(DIST)/command.js
	bun build src/js/command.js --format=esm --outfile $(DIST)/command.esm.js
	bun build src/css/components/select.css --outfile $(DIST)/select.css
	bun build src/js/select.js --format=iife --outfile $(DIST)/select.js
	bun build src/js/select.js --format=esm --outfile $(DIST)/select.esm.js
	bun build src/css/components/theme-switcher.css --outfile $(DIST)/theme-switcher.css
	bun build src/js/theme-switcher.js --format=iife --outfile $(DIST)/theme-switcher.js
	bun build src/js/theme-switcher.js --format=esm --outfile $(DIST)/theme-switcher.esm.js
	bun build src/css/components/tooltip-compat.css --outfile $(DIST)/tooltip-compat.css
	bun build src/js/tooltip-compat.js --format=iife --outfile $(DIST)/tooltip-compat.js
	bun build src/js/tooltip-compat.js --format=esm --outfile $(DIST)/tooltip-compat.esm.js
	bun build src/css/components/chart.css --outfile $(DIST)/chart.css
	bun build src/css/components/scroll-area.css --outfile $(DIST)/scroll-area.css
	bun build src/css/components/drawer.css --outfile $(DIST)/drawer.css
	bun build src/css/components/empty.css --outfile $(DIST)/empty.css
	bun build src/css/components/item.css --outfile $(DIST)/item.css
	bun build src/css/components/kbd.css --outfile $(DIST)/kbd.css
	bun build src/css/components/callout.css --outfile $(DIST)/callout.css
	bun build src/css/utilities.css --outfile $(DIST)/utilities.css
	bun build src/css/components/copy-button.css --outfile $(DIST)/copy-button.css
	bun build src/js/copy-button.js --format=iife --outfile $(DIST)/copy-button.js
	bun build src/js/copy-button.js --format=esm --outfile $(DIST)/copy-button.esm.js
	bun build src/css/components/action-field.css --outfile $(DIST)/action-field.css
	bun build src/js/action-field.js --format=iife --outfile $(DIST)/action-field.js
	bun build src/js/action-field.js --format=esm --outfile $(DIST)/action-field.esm.js
	bun build src/css/components/multiselect.css --outfile $(DIST)/multiselect.css
	bun build src/js/multiselect.js --format=iife --outfile $(DIST)/multiselect.js
	bun build src/js/multiselect.js --format=esm --outfile $(DIST)/multiselect.esm.js
	bun build src/css/components/password-field.css --outfile $(DIST)/password-field.css
	bun build src/js/password-field.js --format=iife --outfile $(DIST)/password-field.js
	bun build src/js/password-field.js --format=esm --outfile $(DIST)/password-field.esm.js
	bun build src/css/components/splitter.css --outfile $(DIST)/splitter.css
	bun build src/js/splitter.js --format=iife --outfile $(DIST)/splitter.js
	bun build src/js/splitter.js --format=esm --outfile $(DIST)/splitter.esm.js
	bun build src/css/components/tree.css --outfile $(DIST)/tree.css
	bun build src/js/tree.js --format=iife --outfile $(DIST)/tree.js
	bun build src/js/tree.js --format=esm --outfile $(DIST)/tree.esm.js
	bun build src/css/components/toggle.css --outfile $(DIST)/toggle.css
	bun build src/js/toggle.js --format=iife --outfile $(DIST)/toggle.js
	bun build src/js/toggle.js --format=esm --outfile $(DIST)/toggle.esm.js
	bun build src/css/components/toolbar.css --outfile $(DIST)/toolbar.css
	bun build src/js/toolbar.js --format=iife --outfile $(DIST)/toolbar.js
	bun build src/js/toolbar.js --format=esm --outfile $(DIST)/toolbar.esm.js
	bun build src/css/components/choice-card.css --outfile $(DIST)/choice-card.css
	bun build src/css/components/otp-input.css --outfile $(DIST)/otp-input.css
	bun build src/js/otp-input.js --format=iife --outfile $(DIST)/otp-input.js
	bun build src/js/otp-input.js --format=esm --outfile $(DIST)/otp-input.esm.js
	bun build src/css/components/lightbox.css --outfile $(DIST)/lightbox.css
	bun build src/js/lightbox.js --format=iife --outfile $(DIST)/lightbox.js
	bun build src/js/lightbox.js --format=esm --outfile $(DIST)/lightbox.esm.js
	bun build src/css/components/scrollspy.css --outfile $(DIST)/scrollspy.css
	bun build src/js/scrollspy.js --format=iife --outfile $(DIST)/scrollspy.js
	bun build src/js/scrollspy.js --format=esm --outfile $(DIST)/scrollspy.esm.js
	bun build src/css/components/footnotes.css --outfile $(DIST)/footnotes.css
	bun build src/js/footnotes.js --format=iife --outfile $(DIST)/footnotes.js
	bun build src/js/footnotes.js --format=esm --outfile $(DIST)/footnotes.esm.js
	bun build src/css/components/reading-progress.css --outfile $(DIST)/reading-progress.css
	bun build src/js/reading-progress.js --format=iife --outfile $(DIST)/reading-progress.js
	bun build src/js/reading-progress.js --format=esm --outfile $(DIST)/reading-progress.esm.js
	bun build src/css/components/data-table.css --outfile $(DIST)/data-table.css
	bun build src/js/data-table.js --format=iife --outfile $(DIST)/data-table.js
	bun build src/js/data-table.js --format=esm --outfile $(DIST)/data-table.esm.js
	bun build src/css/components/repeater.css --outfile $(DIST)/repeater.css
	bun build src/js/repeater.js --format=iife --outfile $(DIST)/repeater.js
	bun build src/js/repeater.js --format=esm --outfile $(DIST)/repeater.esm.js
	bun build src/css/components/log-viewer.css --outfile $(DIST)/log-viewer.css
	bun build src/js/log-viewer.js --format=iife --outfile $(DIST)/log-viewer.js
	bun build src/js/log-viewer.js --format=esm --outfile $(DIST)/log-viewer.esm.js
	bun build src/css/components/prose.css --outfile $(DIST)/prose.css
	bun build src/css/components/description-list.css --outfile $(DIST)/description-list.css
	bun build src/css/components/rating.css --outfile $(DIST)/rating.css
	bun build src/css/components/segmented-control.css --outfile $(DIST)/segmented-control.css
	bun build src/css/components/stat.css --outfile $(DIST)/stat.css
	bun build src/css/components/stepper.css --outfile $(DIST)/stepper.css
	bun build src/css/components/timeline.css --outfile $(DIST)/timeline.css
	bun build src/css/components/message.css --outfile $(DIST)/message.css
	bun build src/css/components/attachment.css --outfile $(DIST)/attachment.css
	bun build src/css/components/code-block.css --outfile $(DIST)/code-block.css
	bun build src/css/components/trace.css --outfile $(DIST)/trace.css
	bun build src/css/components/message-scroller.css --outfile $(DIST)/message-scroller.css
	bun build src/js/message-scroller.js --format=iife --outfile $(DIST)/message-scroller.js
	bun build src/js/message-scroller.js --format=esm --outfile $(DIST)/message-scroller.esm.js
	bun build src/css/components/aspect-ratio.css --outfile $(DIST)/aspect-ratio.css
	bun build src/css/components/bubble.css --outfile $(DIST)/bubble.css
	bun build src/css/components/marker.css --outfile $(DIST)/marker.css
	bun build src/css/components/carousel.css --outfile $(DIST)/carousel.css
	bun build src/css/components/calendar.css --outfile $(DIST)/calendar.css
	bun build src/css/components/context-menu.css --outfile $(DIST)/context-menu.css
	bun build src/css/components/hover-card.css --outfile $(DIST)/hover-card.css
	bun build src/css/components/menubar.css --outfile $(DIST)/menubar.css
	bun build src/css/components/questionnaire.css --outfile $(DIST)/questionnaire.css
	bun build src/css/components/toggle-group.css --outfile $(DIST)/toggle-group.css
	bun build src/js/carousel.js --format=iife --outfile $(DIST)/carousel.js
	bun build src/js/carousel.js --format=esm --outfile $(DIST)/carousel.esm.js
	bun build src/js/calendar.js --format=iife --outfile $(DIST)/calendar.js
	bun build src/js/calendar.js --format=esm --outfile $(DIST)/calendar.esm.js
	bun build src/js/context-menu.js --format=iife --outfile $(DIST)/context-menu.js
	bun build src/js/context-menu.js --format=esm --outfile $(DIST)/context-menu.esm.js
	bun build src/js/hover-card.js --format=iife --outfile $(DIST)/hover-card.js
	bun build src/js/hover-card.js --format=esm --outfile $(DIST)/hover-card.esm.js
	bun build src/js/menubar.js --format=iife --outfile $(DIST)/menubar.js
	bun build src/js/menubar.js --format=esm --outfile $(DIST)/menubar.esm.js
	bun build src/js/questionnaire.js --format=iife --outfile $(DIST)/questionnaire.js
	bun build src/js/questionnaire.js --format=esm --outfile $(DIST)/questionnaire.esm.js
	bun build src/css/patterns.css --outfile $(DIST)/patterns.css
	bun build src/css/patterns.css --minify --outfile $(DIST)/patterns.min.css
	bun build src/js/patterns.js --format=iife --outfile $(DIST)/patterns.js
	bun build src/js/patterns.js --format=esm --outfile $(DIST)/patterns.esm.js
	bun build src/js/patterns.js --format=iife --minify --outfile $(DIST)/patterns.min.js
	@mkdir -p $(DIST)/themes
	cp src/css/themes.css $(DIST)/themes.css
	cp src/css/themes/oat.css $(DIST)/themes/oat.css
	cp src/css/themes/doordarshan.css $(DIST)/themes/doordarshan.css
	cp src/css/themes/forest.css $(DIST)/themes/forest.css
	cp src/css/themes/ocean.css $(DIST)/themes/ocean.css
	cp src/css/themes/paper.css $(DIST)/themes/paper.css

dist-esgun:
	$(ESGUN) build --dir "$(CURDIR)"
	node scripts/build-full-css.js $(ESGUN_DIST)

verify-esgun: dist dist-esgun
	node scripts/verify-build-parity.js $(DIST) $(ESGUN_DIST)
	bun scripts/browser-smoke.js tests/browser.html $(ESGUN_DIST)

test: dist
	bun test
	bun scripts/browser-smoke.js tests/browser.html
	bun scripts/browser-smoke.js tests/docs-browser.html
	bun scripts/playwright-test.js --project=chromium

test-all: test
	bun scripts/playwright-test.js --project=firefox --project=webkit

clean:
	@rm -rf $(DIST) $(ESGUN_DIST)
