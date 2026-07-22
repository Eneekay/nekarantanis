// Makes the Decap CMS live-preview pane look like the real site instead of
// default plain markdown rendering: loads the site's own stylesheets into
// the preview iframe, and wraps the rendered body in the same container
// class (.post-body-inner) the real post layout uses, so things like the
// larger lede paragraph and the pull-quote blockquote style actually apply.
;(function () {
  var h = window.h;
  var createClass = window.createClass;

  CMS.registerPreviewStyle(
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap'
  );
  CMS.registerPreviewStyle('../css/bootstrap.min.css');
  CMS.registerPreviewStyle('../css/custom.css');

  // Reuses the site's real classnames (not guessed-at inline styles) so the
  // already-registered custom.css renders this exactly like the live post
  // page: a dark header block for the title, then the light article body.
  var PostPreview = createClass({
    render: function () {
      var entry = this.props.entry;
      var title = entry.getIn(['data', 'title']);
      var category = entry.getIn(['data', 'category']);
      var body = this.props.widgetFor('body');
      var image = entry.getIn(['data', 'image']);

      // Best-effort mirror of the mid-article splice the real post layout
      // does. The rendered body is a React tree, not the raw HTML string
      // Liquid works with, so this only works when it comes back as a
      // wrapping element with a plain array of block children; otherwise
      // it falls back to showing the image after the body so a broken
      // assumption here can't take down the whole preview.
      if (image) {
        var imageAlt = entry.getIn(['data', 'image_alt']) || title;
        var imageCaption = entry.getIn(['data', 'image_caption']);
        var figure = h(
          'figure',
          { className: 'post-featured-image' },
          h('img', { src: this.props.getAsset(image), alt: imageAlt }),
          imageCaption ? h('figcaption', {}, imageCaption) : null
        );

        var children = body && body.props && body.props.children;
        if (Array.isArray(children) && children.length > 1) {
          var mid = Math.max(1, Math.floor(children.length / 2));
          body = h('div', {}, children.slice(0, mid), figure, children.slice(mid));
        } else {
          body = h('div', {}, body, figure);
        }
      }

      return h(
        'div',
        {},
        h(
          'header',
          { className: 'section-dark-dotted text-c3 position-relative overflow-hidden' },
          h(
            'div',
            { className: 'container position-relative post-header-inner' },
            category
              ? h('div', { className: 'fs-13 fw-semibold text-gold text-uppercase ls-15 mb-3' }, category)
              : null,
            h('h1', { className: 'fs-post-title fw-semibold text-c4 mb-3' }, title)
          )
        ),
        h(
          'section',
          { className: 'bg-c4' },
          h('div', { className: 'container post-body-inner' }, body)
        )
      );
    },
  });

  CMS.registerPreviewTemplate('posts', PostPreview);
})();
