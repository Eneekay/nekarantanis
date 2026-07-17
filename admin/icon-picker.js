// Custom Decap CMS widget: shows the blog post icon choices as a clickable
// grid instead of a plain <select>, so more options are visible at once and
// each one previews the actual icon rather than just its name. Mirrors the
// icon set in _includes/post-icon.html - keep both in sync when adding icons.
// `h` and `createClass` are globals exposed by the decap-cms.js bundle for
// exactly this no-build-step custom widget scenario.
;(function () {
  var h = window.h;
  var createClass = window.createClass;
  var STROKE = '#2653D9';
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
    chat: svg('<path d="M21 11.5c0 4.4-4 8-9 8-1.4 0-2.7-.3-3.9-.8L3 21l1.4-4.2A7.8 7.8 0 0 1 3 11.5c0-4.4 4-8 9-8s9 3.6 9 8z"></path>'),
    anchor: svg('<circle cx="12" cy="5" r="3"></circle><line x1="12" y1="8" x2="12" y2="21"></line><path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>'),
    bell: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path>'),
    bookmark: svg('<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"></path>'),
    building: svg('<rect x="4" y="2" width="16" height="20" rx="1"></rect><line x1="9" y1="6" x2="9" y2="6.01"></line><line x1="15" y1="6" x2="15" y2="6.01"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="15" y2="18"></line>'),
    chart: svg('<line x1="6" y1="20" x2="6" y2="12"></line><line x1="12" y1="20" x2="12" y2="8"></line><line x1="18" y1="20" x2="18" y2="14"></line><line x1="3" y1="20" x2="21" y2="20"></line>'),
    clipboard: svg('<rect x="6" y="4" width="12" height="17" rx="2"></rect><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"></path><line x1="9" y1="10" x2="15" y2="10"></line><line x1="9" y1="14" x2="15" y2="14"></line>'),
    clock: svg('<circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15.5 14"></polyline>'),
    document: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line>'),
    edit: svg('<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>'),
    lightbulb: svg('<path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"></path>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path>'),
    mail: svg('<rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M3 6l9 7 9-7"></path>'),
    map: svg('<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line>'),
    mic: svg('<rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0"></path><line x1="12" y1="19" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line>'),
    monkey: svg('<circle cx="6.3" cy="4" r="1.2"></circle><circle cx="12.7" cy="4" r="1.2"></circle><circle cx="9.5" cy="5.5" r="3"></circle><circle cx="9.5" cy="13" r="4.3"></circle><path d="M7,17 C5,19 3.5,20.5 2,21.5"></path><path d="M12,17 C13,19.5 12,21.7 9,22.3"></path><path d="M13.5,11 C17,10.5 19.5,7.5 18.7,4.8 C18.3,3.3 16.3,2.8 15.3,4.2"></path>'),
    phone: svg('<path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"></path>'),
    rss: svg('<path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1.5"></circle>'),
    search: svg('<circle cx="10" cy="10" r="7"></circle><line x1="21" y1="21" x2="15" y2="15"></line>'),
    share: svg('<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"></line><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line>'),
    video: svg('<rect x="2" y="6" width="14" height="12" rx="2"></rect><polygon points="22 8 16 12 22 16 22 8"></polygon>'),
    zap: svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>')
  };

  var LABELS = {
    anchor: 'Anchor', award: 'Award', bell: 'Bell', book: 'Book', bookmark: 'Bookmark',
    briefcase: 'Briefcase', building: 'Building', calendar: 'Calendar', cap: 'Cap', chart: 'Chart',
    chat: 'Chat', check: 'Check', clipboard: 'Clipboard', clock: 'Clock', cloud: 'Cloud',
    compass: 'Compass', document: 'Document', edit: 'Edit', flag: 'Flag', globe: 'Globe',
    heart: 'Heart', lightbulb: 'Lightbulb', lock: 'Lock', mail: 'Mail', map: 'Map',
    mic: 'Mic', monitor: 'Monitor', monkey: 'Monkey', person: 'Person', phone: 'Phone', pin: 'Pin',
    rss: 'RSS', search: 'Search', share: 'Share', shield: 'Shield', star: 'Star',
    target: 'Target', team: 'Team', trending: 'Trending', video: 'Video', zap: 'Zap'
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
                border: selected ? '2px solid #2653D9' : '1px solid #dcdee0',
                background: selected ? 'rgba(38, 83, 217, 0.1)' : '#fff',
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
