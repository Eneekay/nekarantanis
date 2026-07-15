// Custom Decap CMS widget: shows the blog post icon choices as a clickable
// grid instead of a plain <select>, so more options are visible at once and
// each one previews the actual icon rather than just its name. Mirrors the
// icon set in _includes/post-icon.html - keep both in sync when adding icons.
// `h` and `createClass` are globals exposed by the decap-cms.js bundle for
// exactly this no-build-step custom widget scenario.
;(function () {
  var h = window.h;
  var createClass = window.createClass;
  var STROKE = '#45A29E';
  var svg = function (inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="' + STROKE + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  };

  var ICONS = {
    heart: svg('<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z"></path>'),
    check: svg('<path d="M9 11l3 3 8-8"></path><path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"></path>'),
    book: svg('<path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-1.5z"></path><path d="M6 3v18"></path>'),
    pin: svg('<path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z"></path><circle cx="12" cy="9" r="2.5"></circle>'),
    cap: svg('<path d="M22 10L12 5 2 10l10 5 10-5z"></path><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"></path>'),
    cloud: svg('<rect x="3" y="4" width="18" height="14" rx="2"></rect><path d="M8 21h8M12 18v3"></path>'),
    person: svg('<circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4.4 3.6-6 8-6s8 1.6 8 6"></path>'),
    compass: svg('<circle cx="12" cy="12" r="9"></circle><path d="M15 9l-2 6-6 2 2-6 6-2z"></path>'),
    team: svg('<circle cx="9" cy="8" r="3"></circle><path d="M2 20c0-3.5 3-5 7-5s7 1.5 7 5"></path><circle cx="17" cy="9" r="2.3"></circle><path d="M17 12.5c2.4 0 4 1.2 4 3.5"></path>'),
    trending: svg('<polyline points="1 17 8.5 9.5 13.5 14.5 21 6"></polyline><polyline points="15 6 21 6 21 12"></polyline>'),
    award: svg('<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>'),
    target: svg('<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle>'),
    shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>'),
    flag: svg('<line x1="5" y1="21" x2="5" y2="4"></line><path d="M5 4s1.2-1 4-1 4 2 7 2 4-1 4-1v10s-1.2 1-4 1-4-2-7-2-4 1-4 1"></path>'),
    calendar: svg('<rect x="3" y="4" width="18" height="17" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'),
    globe: svg('<circle cx="12" cy="12" r="9"></circle><line x1="3" y1="12" x2="21" y2="12"></line><path d="M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9z"></path>'),
    briefcase: svg('<rect x="2" y="7" width="20" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>'),
    monitor: svg('<rect x="2" y="4" width="20" height="13" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>'),
    star: svg('<polygon points="12 2 15 9 22 9.5 16.5 14 18 21 12 17.3 6 21 7.5 14 2 9.5 9 9 12 2"></polygon>'),
    chat: svg('<path d="M21 11.5c0 4.4-4 8-9 8-1.4 0-2.7-.3-3.9-.8L3 21l1.4-4.2A7.8 7.8 0 0 1 3 11.5c0-4.4 4-8 9-8s9 3.6 9 8z"></path>')
  };

  var LABELS = {
    award: 'Award', book: 'Book', briefcase: 'Briefcase', calendar: 'Calendar', cap: 'Cap',
    check: 'Check', chat: 'Chat', cloud: 'Cloud', compass: 'Compass', flag: 'Flag',
    globe: 'Globe', heart: 'Heart', monitor: 'Monitor', person: 'Person', pin: 'Pin',
    shield: 'Shield', star: 'Star', target: 'Target', team: 'Team', trending: 'Trending'
  };

  var ORDER = Object.keys(LABELS).sort();

  var IconPickerControl = createClass({
    render: function () {
      var value = this.props.value;
      var onChange = this.props.onChange;
      return h(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
            gap: '8px',
            padding: '4px 0',
          },
        },
        ORDER.map(function (key) {
          var selected = key === value;
          return h(
            'button',
            {
              key: key,
              type: 'button',
              title: LABELS[key],
              onClick: function (e) {
                e.preventDefault();
                onChange(key);
              },
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 4px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: selected ? '2px solid #45A29E' : '1px solid #dcdee0',
                background: selected ? 'rgba(69, 162, 158, 0.1)' : '#fff',
                fontSize: '12px',
                color: '#333',
              },
            },
            h('span', {
              style: { width: '26px', height: '26px', display: 'block' },
              dangerouslySetInnerHTML: { __html: ICONS[key] },
            }),
            h('span', {}, LABELS[key])
          );
        })
      );
    },
  });

  var IconPickerPreview = createClass({
    render: function () {
      var value = this.props.value;
      if (!value || !ICONS[value]) return h('p', {}, 'No icon selected');
      return h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        h('span', {
          style: { width: '22px', height: '22px', display: 'block' },
          dangerouslySetInnerHTML: { __html: ICONS[value] },
        }),
        h('span', {}, LABELS[value] || value)
      );
    },
  });

  CMS.registerWidget('icon-picker', IconPickerControl, IconPickerPreview);
})();
