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

  var PostPreview = createClass({
    render: function () {
      var entry = this.props.entry;
      var title = entry.getIn(['data', 'title']);
      var category = entry.getIn(['data', 'category']);
      var body = this.props.widgetFor('body');

      return h(
        'div',
        { style: { fontFamily: "'Inter', sans-serif", background: '#EAEBEC', minHeight: '100vh', padding: '56px 20px' } },
        h(
          'div',
          { style: { maxWidth: '760px', margin: '0 auto' } },
          category
            ? h(
                'div',
                {
                  style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#45A29E',
                    marginBottom: '12px',
                  },
                },
                category
              )
            : null,
          h(
            'h1',
            {
              className: 'fs-post-title fw-semibold',
              style: { fontFamily: "'Space Grotesk', sans-serif", marginBottom: '28px', color: '#0B0C10' },
            },
            title
          ),
          h('div', { className: 'post-body-inner' }, body)
        )
      );
    },
  });

  CMS.registerPreviewTemplate('posts', PostPreview);
})();
