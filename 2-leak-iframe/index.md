# Scenario 2 - Leaking An Iframe Directly

This scenario illustrates what happens when the reference to the iframe is leaked directly by the main window. You can see that _only_ leaking the HTMLIframeElement is not a big deal because its window (and realm) still get garbage collected (i.e. all the bigObject arrays that get created will be cleaned up).
