(function () {
  'use strict';

  function $(id) {
    return document.getElementById(id);
  }

  function auth() {
    return window.AtomurusAuth;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function fetchJson(url, options) {
    var res = await fetch(url, Object.assign({
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }, options || {}));
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok || data.ok === false) {
      var err = new Error(data.error || 'Request failed');
      err.status = res.status;
      err.code = data.code;
      throw err;
    }
    return data;
  }

  function card(label, value) {
    return '<div class="lc-doc-card"><div class="lbl">' +
      escapeHtml(label) +
      '</div><div class="v">' +
      escapeHtml(value) +
      '</div></div>';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (_err) {
      return String(iso);
    }
  }

  function planLabel(user) {
    if (!user) return 'free';
    if (user.planSource === 'trial' || user.planSource === 'billing_trial') return 'pro trial';
    if (user.plan === 'admin') return 'admin';
    if (user.isPro) return 'pro';
    return user.plan || 'free';
  }

  function markReady() {
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-ready');
  }

  function renderAccount(data) {
    var node = $('app-account');
    var user = data.user || {};
    if ($('aside-plan')) $('aside-plan').textContent = planLabel(user);
    if ($('aside-role')) $('aside-role').textContent = user.role || 'member';
    if (!node) return;
    var displayName = user.displayName || user.fullName || user.username || user.email || 'member';
    var billingLabel = user.billingPeriod && user.billingCurrency
      ? (user.billingPeriod + ' / ' + String(user.billingCurrency).toUpperCase())
      : 'trial or free';
    node.innerHTML = [
      card('name', displayName),
      card('email', user.email || 'unknown'),
      card('plan', planLabel(user)),
      card('billing', billingLabel),
      card('ads', user.adsFree ? 'off (pro)' : 'on'),
      card('trial ends', formatDate(user.trialEndsAt)),
      card('role', user.role || 'member'),
      card('email status', user.emailConfirmed ? 'confirmed' : 'pending')
    ].join('');
  }

  function renderUpgrade(data) {
    var box = $('app-upgrade');
    if (!box) return;
    var user = data.user || {};
    if (user.isPro) {
      box.innerHTML = '<strong>Pro active.</strong> Ads are off on this account' +
        (user.planSource === 'trial' && user.trialEndsAt
          ? ' until ' + escapeHtml(formatDate(user.trialEndsAt)) + '.'
          : '.') +
        ' <a href="/pricing">Manage plans</a>';
      box.classList.remove('warn');
      box.classList.add('ok');
      box.style.display = 'block';
      return;
    }
    box.innerHTML = '<strong>Free account.</strong> Start the included 30-day Pro trial path from Pricing, then keep studying without ads. <a href="/pricing">Compare Free vs Pro</a> · <a href="/login">Create account</a>';
    box.classList.add('warn');
    box.classList.remove('ok');
    box.style.display = 'block';
  }

  function renderDashboard(data) {
    var status = $('app-status');
    if (status && data.access) {
      status.textContent = (data.dashboard && data.dashboard.status) || (data.access.plan + ' / ' + data.access.role);
    }
    renderUpgrade(data);

    var next = $('app-next-steps');
    if (next && data.dashboard && Array.isArray(data.dashboard.nextSteps)) {
      next.innerHTML = data.dashboard.nextSteps.map(function (step) {
        return '<li>' + escapeHtml(step) + '</li>';
      }).join('');
    }

    var modules = $('app-modules');
    if (!modules || !data.dashboard || !Array.isArray(data.dashboard.modules)) return;
    modules.innerHTML = data.dashboard.modules
      .filter(function (item) { return item.state !== 'hidden'; })
      .map(function (item) {
        var state = String(item.state || '');
        var href = item.href || '/pricing';
        return '<a class="lc-doc-card app-module-row" href="' + escapeHtml(href) + '">' +
          '<div>' +
          '<div class="lbl">' + escapeHtml(item.label || item.id) + '</div>' +
          '<div class="v">' + escapeHtml(item.description || item.id) + '</div>' +
          '</div><span class="app-pill ' + escapeHtml(state) + '">' + escapeHtml(state) + '</span></a>';
      })
      .join('');
  }

  function showError() {
    var loading = $('app-loading');
    var error = $('app-error');
    if (loading) loading.style.display = 'none';
    if (error) error.classList.add('show');
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-error');
  }

  function initLogout() {
    async function doLogout(event) {
      if (event) event.preventDefault();
      var client = auth();
      if (client) {
        try { await client.logout(); } catch (_err) {}
        client.redirectToLogin(location.pathname + location.search);
        return;
      }
      window.location.replace('/login?next=' + encodeURIComponent('/app'));
    }
    var btn = $('app-logout');
    var aside = $('app-logout-aside');
    if (btn) btn.addEventListener('click', doLogout);
    if (aside) aside.addEventListener('click', doLogout);
  }

  function workspaceNext() {
    return location.pathname + location.search;
  }

  function studySection() {
    try {
      var section = new URLSearchParams(location.search).get('section') || 'overview';
      if (['overview', 'library', 'history', 'notes', 'progress', 'sets', 'review'].indexOf(section) === -1) return 'overview';
      return section;
    } catch (_err) {
      return 'overview';
    }
  }

  function studySetIdFromQuery() {
    try {
      var raw = String(new URLSearchParams(location.search).get('set') || '').trim();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) return '';
      return raw;
    } catch (_err) {
      return '';
    }
  }

  function renderStudyNav() {
    var nav = $('app-study-nav');
    if (!nav) return;
    var current = studySection();
    var links = [
      ['overview', 'Overview'],
      ['library', 'Library'],
      ['sets', 'Study Sets'],
      ['review', 'Smart Review'],
      ['history', 'History'],
      ['notes', 'Notes'],
      ['progress', 'Continue studying']
    ];
    nav.innerHTML = links.map(function (pair) {
      var cls = pair[0] === current ? 'active' : '';
      return '<a class="' + cls + '" href="/app?section=' + pair[0] + '">' + escapeHtml(pair[1]) + '</a>';
    }).join('');
  }

  var reviewSession = null;
  var reviewBusy = false;

  function newClientEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0').slice(-12);
  }

  function setHref(id) {
    return '/app?section=sets&set=' + encodeURIComponent(id);
  }

  function reviewHref(id) {
    return id ? '/app?section=review&set=' + encodeURIComponent(id) : '/app?section=review';
  }

  function bindReviewKeys() {
    if (bindReviewKeys.bound) return;
    bindReviewKeys.bound = true;
    document.addEventListener('keydown', function (event) {
      if (!reviewSession || !reviewSession.active) return;
      var target = event.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        if (!reviewSession.revealed) revealReviewCard();
        return;
      }
      if (!reviewSession.revealed) return;
      if (event.key === '1') gradeReview('again');
      if (event.key === '2') gradeReview('hard');
      if (event.key === '3') gradeReview('good');
      if (event.key === '4') gradeReview('easy');
    });
  }

  function paintReviewCard() {
    var root = document.getElementById('app-review-session');
    if (!root || !reviewSession) return;
    var card = reviewSession.cards[reviewSession.index];
    var meta = root.querySelector('[data-review-meta]');
    var front = root.querySelector('[data-review-front]');
    var back = root.querySelector('[data-review-back]');
    var reveal = root.querySelector('[data-review-reveal]');
    var ratings = root.querySelector('[data-review-ratings]');
    var empty = root.querySelector('[data-review-empty]');
    if (!card) {
      if (front) front.textContent = '';
      if (back) back.textContent = '';
      if (meta) meta.textContent = '';
      if (reveal) reveal.hidden = true;
      if (ratings) ratings.hidden = true;
      if (empty) {
        empty.hidden = false;
        empty.textContent = 'No cards due right now.';
      }
      reviewSession.active = false;
      return;
    }
    if (empty) empty.hidden = true;
    if (meta) meta.textContent = (reviewSession.title || 'Smart Review') + ' · Card ' + String(reviewSession.index + 1) + ' of ' + String(reviewSession.cards.length);
    if (front) front.textContent = card.front || '';
    if (back) {
      back.textContent = reviewSession.revealed ? (card.back || '') : '';
      back.hidden = !reviewSession.revealed;
    }
    if (reveal) reveal.hidden = reviewSession.revealed;
    if (ratings) ratings.hidden = !reviewSession.revealed;
  }

  function revealReviewCard() {
    if (!reviewSession) return;
    reviewSession.revealed = true;
    paintReviewCard();
  }

  function startReviewSession(data, title) {
    bindReviewKeys();
    reviewSession = {
      active: true,
      revealed: false,
      index: 0,
      title: title || 'Smart Review',
      cards: (data && data.cards) || []
    };
    var node = $('app-study');
    if (!node) return;
    node.innerHTML =
      '<div id="app-review-session" class="app-review">' +
      '<div class="lbl" data-review-meta></div>' +
      '<div class="app-review-face" data-review-front></div>' +
      '<button type="button" class="app-review-reveal" data-review-reveal>Show answer</button>' +
      '<div class="app-review-face app-review-back" data-review-back hidden></div>' +
      '<div class="app-review-ratings" data-review-ratings hidden>' +
      '<button type="button" data-grade="again">Again</button>' +
      '<button type="button" data-grade="hard">Hard</button>' +
      '<button type="button" data-grade="good">Good</button>' +
      '<button type="button" data-grade="easy">Easy</button>' +
      '</div>' +
      '<div class="app-study-empty" data-review-empty hidden></div>' +
      '<p class="app-review-hint">Space reveals · 1 Again · 2 Hard · 3 Good · 4 Easy</p>' +
      '</div>';
    var root = document.getElementById('app-review-session');
    root.querySelector('[data-review-reveal]').addEventListener('click', revealReviewCard);
    root.querySelector('[data-review-ratings]').addEventListener('click', function (event) {
      var btn = event.target && event.target.closest && event.target.closest('[data-grade]');
      if (!btn) return;
      gradeReview(btn.getAttribute('data-grade'));
    });
    paintReviewCard();
  }

  async function gradeReview(rating) {
    if (!reviewSession || !reviewSession.active || reviewBusy) return;
    var card = reviewSession.cards[reviewSession.index];
    if (!card || !reviewSession.revealed) return;
    var api = window.AtomurusStudy;
    if (!api) return;
    reviewBusy = true;
    try {
      await api.submitReview({
        cardId: card.id,
        rating: rating,
        clientEventId: newClientEventId(),
        expectedVersion: card.version
      });
      reviewSession.index += 1;
      reviewSession.revealed = false;
      paintReviewCard();
    } catch (err) {
      if (err && err.code === 'review_conflict') {
        reviewSession.index += 1;
        reviewSession.revealed = false;
        paintReviewCard();
      } else {
        var empty = document.querySelector('[data-review-empty]');
        if (empty) {
          empty.hidden = false;
          empty.textContent = (err && err.message) || 'Could not save this review.';
        }
      }
    } finally {
      reviewBusy = false;
    }
  }

  function itemCard(item) {
    var href = item.href || '/app';
    var title = item.title || item.itemKey || 'item';
    var note = item.note ? '<div class="v">' + escapeHtml(item.note) + '</div>' : '';
    var tags = Array.isArray(item.tags) && item.tags.length
      ? '<div class="v">' + escapeHtml(item.tags.join(', ')) + '</div>'
      : '';
    return '<a class="lc-doc-card app-module-row" href="' + escapeHtml(href) + '"><div>' +
      '<div class="lbl">' + escapeHtml(title) + '</div>' +
      '<div class="v">' + escapeHtml(item.itemType || '') + '</div>' +
      note + tags +
      '</div></a>';
  }

  function progressCard(row) {
    var href = row.lastPosition || '/app';
    return '<a class="lc-doc-card app-module-row" href="' + escapeHtml(href) + '"><div>' +
      '<div class="lbl">' + escapeHtml(row.contentKey || row.contentType || 'progress') + '</div>' +
      '<div class="v">' + escapeHtml(String(row.progress || 0) + '% · ' + (row.status || '')) + '</div>' +
      '</div></a>';
  }

  function showStudyLocked(node, err) {
    node.innerHTML = '<div class="app-study-empty">' +
      escapeHtml('Study Cloud is included with Atomurus Pro.') +
      ' <a href="' + escapeHtml((err && err.upgradeUrl) || '/pricing') + '">See plans</a></div>';
  }

  function setCardRow(entry) {
    return '<div class="lc-doc-card app-module-row" data-card-id="' + escapeHtml(entry.id) + '">' +
      '<div><div class="lbl">' + escapeHtml(entry.front) + '</div>' +
      '<div class="v">' + escapeHtml(entry.suspended ? 'suspended' : (entry.mastered ? 'mastered' : (entry.reviewState || 'new'))) + '</div></div>' +
      '<div class="app-card-actions">' +
      '<button type="button" data-card-action="toggle" data-card-id="' + escapeHtml(entry.id) + '" data-suspended="' + (entry.suspended ? '1' : '0') + '">' +
      escapeHtml(entry.suspended ? 'Resume' : 'Suspend') + '</button>' +
      '<button type="button" data-card-action="delete" data-card-id="' + escapeHtml(entry.id) + '">Delete</button>' +
      '</div></div>';
  }

  function libraryRow(item) {
    var href = item.href || '/app';
    var title = item.title || item.itemKey || 'item';
    var canGenerate = item.itemType === 'element' || item.itemType === 'molecule';
    return '<div class="lc-doc-card app-module-row" data-library-id="' + escapeHtml(item.id) + '">' +
      '<div><a href="' + escapeHtml(href) + '"><div class="lbl">' + escapeHtml(title) + '</div></a>' +
      '<div class="v">' + escapeHtml(item.itemType || '') + '</div></div>' +
      '<div class="app-card-actions">' +
      '<button type="button" data-add-to-set="' + escapeHtml(item.id) + '">Add to set</button>' +
      (canGenerate
        ? '<button type="button" data-generate-item="' + escapeHtml(item.id) + '" disabled>Generate cards</button>'
        : '') +
      '</div></div>';
  }

  function bindLibrarySetActions(node, api) {
    var picker = $('app-library-picker');
    var activeItemId = '';
    node.onclick = function (event) {
      var addBtn = event.target && event.target.closest && event.target.closest('[data-add-to-set]');
      var genBtn = event.target && event.target.closest && event.target.closest('[data-generate-item]');
      if (addBtn) {
        activeItemId = addBtn.getAttribute('data-add-to-set') || '';
        api.listSets().then(function (data) {
          if (!picker) return;
          picker.hidden = false;
          picker.textContent = '';
          (data.sets || []).forEach(function (set) {
            var choice = document.createElement('button');
            choice.type = 'button';
            choice.textContent = set.title || 'Study Set';
            choice.addEventListener('click', function () {
              api.addSetItem({ setId: set.id, itemId: activeItemId }).then(function (result) {
                picker.textContent = 'Added to ' + (result.setTitle || set.title) + ' ✓';
                var generate = node.querySelector('[data-generate-item="' + activeItemId + '"]');
                if (generate) {
                  generate.disabled = false;
                  generate.setAttribute('data-set-id', set.id);
                }
              }).catch(function (err) {
                picker.textContent = (err && err.message) || 'Could not add to this set.';
              });
            });
            picker.appendChild(choice);
          });
          var newer = document.createElement('button');
          newer.type = 'button';
          newer.textContent = '+ New Study Set';
          newer.addEventListener('click', function () {
            var title = window.prompt('Study Set title');
            if (!title) return;
            api.createSet({ title: title }).then(function (created) {
              return api.addSetItem({ setId: created.set.id, itemId: activeItemId }).then(function () {
                picker.textContent = 'Added to ' + (created.set.title || title) + ' ✓';
                var generate = node.querySelector('[data-generate-item="' + activeItemId + '"]');
                if (generate) {
                  generate.disabled = false;
                  generate.setAttribute('data-set-id', created.set.id);
                }
              });
            }).catch(function (err) {
              picker.textContent = (err && err.message) || 'Could not create this set.';
            });
          });
          picker.appendChild(newer);
        }).catch(function (err) {
          if (picker) {
            picker.hidden = false;
            picker.textContent = (err && err.message) || 'Could not load Study Sets.';
          }
        });
        return;
      }
      if (genBtn) {
        var itemId = genBtn.getAttribute('data-generate-item');
        var setId = genBtn.getAttribute('data-set-id');
        if (!setId) {
          if (picker) {
            picker.hidden = false;
            picker.textContent = 'Add this item to a Study Set first.';
          }
          return;
        }
        genBtn.disabled = true;
        api.generateCards({ setId: setId, itemId: itemId }).then(function (data) {
          if (picker) {
            picker.hidden = false;
            picker.textContent = '';
            picker.appendChild(document.createTextNode(String(data.created || 0) + ' cards created '));
            var link = document.createElement('a');
            link.href = reviewHref(setId);
            link.textContent = 'Review';
            picker.appendChild(link);
          }
          genBtn.disabled = false;
        }).catch(function (err) {
          genBtn.disabled = false;
          if (picker) picker.textContent = (err && err.message) || 'Could not generate cards.';
        });
      }
    };
  }

  async function renderSetsSection(node, api) {
    var setId = studySetIdFromQuery();
    if (setId) {
      var detail = await api.getSet(setId, { limit: 40 });
      var set = detail.set || {};
      var cardsHtml = (detail.cards || []).map(setCardRow).join('');
      var itemsHtml = (detail.items || []).map(function (entry) {
        var item = entry.item || {};
        return '<div class="v">' + escapeHtml(item.title || item.itemKey || 'item') + '</div>';
      }).join('');
      node.innerHTML =
        '<p class="lbl">' + escapeHtml(set.title || 'Study Set') + '</p>' +
        '<div class="v">' + escapeHtml(set.description || '') + '</div>' +
        '<div class="lc-doc-cards">' +
        card('cards', String(set.cardCount || (detail.cards || []).length)) +
        card('due', String(set.dueCount || 0)) +
        '</div>' +
        '<p><a href="' + escapeHtml(reviewHref(set.id)) + '">Start Review</a></p>' +
        '<button type="button" id="app-generate-set">Generate cards</button> ' +
        '<button type="button" id="app-delete-set">Delete set</button>' +
        '<p class="lbl">Library items</p>' +
        (itemsHtml || '<div class="app-study-empty">Add saved library items to this set.</div>') +
        '<p class="lbl">Add flashcard</p>' +
        '<label class="lbl">Front</label><textarea id="app-card-front" maxlength="1000"></textarea>' +
        '<label class="lbl">Back</label><textarea id="app-card-back" maxlength="3000"></textarea>' +
        '<button type="button" id="app-card-save">Save flashcard</button>' +
        '<p class="lbl">Cards</p>' +
        '<div id="app-set-cards">' +
        (cardsHtml || '<div class="app-study-empty">No flashcards yet.</div>') +
        '</div>' +
        (detail.nextCursor
          ? '<button type="button" id="app-cards-more" data-cursor="' + escapeHtml(detail.nextCursor) + '">Load more</button>'
          : '');
      var generateBtn = $('app-generate-set');
      if (generateBtn) {
        generateBtn.addEventListener('click', function () {
          api.generateCards({ setId: set.id }).then(function (data) {
            window.location.reload();
            void data;
          }).catch(function (err) {
            node.appendChild(document.createTextNode((err && err.message) || 'Could not generate cards.'));
          });
        });
      }
      var deleteBtn = $('app-delete-set');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
          if (!window.confirm('Delete this Study Set and its flashcards? Saved library items will be kept.')) return;
          api.deleteSet(set.id).then(function () {
            window.location.replace('/app?section=sets');
          }).catch(function (err) {
            window.alert((err && err.message) || 'Could not delete this set.');
          });
        });
      }
      var saveCard = $('app-card-save');
      if (saveCard) {
        saveCard.addEventListener('click', function () {
          var front = ($('app-card-front') || {}).value || '';
          var back = ($('app-card-back') || {}).value || '';
          api.createCard({ setId: set.id, front: front, back: back }).then(function () {
            window.location.reload();
          }).catch(function (err) {
            window.alert((err && err.message) || 'Could not save this card.');
          });
        });
      }
      node.onclick = function (event) {
        var more = event.target && event.target.closest && event.target.closest('#app-cards-more');
        if (more) {
          var cursor = more.getAttribute('data-cursor');
          more.disabled = true;
          api.getSet(set.id, { cursor: cursor, limit: 40 }, true).then(function (page) {
            var list = $('app-set-cards');
            (page.cards || []).forEach(function (entry) {
              var wrap = document.createElement('div');
              wrap.innerHTML = setCardRow(entry);
              if (list && wrap.firstChild) list.appendChild(wrap.firstChild);
            });
            if (page.nextCursor) {
              more.setAttribute('data-cursor', page.nextCursor);
              more.disabled = false;
            } else {
              more.remove();
            }
          }).catch(function () {
            more.disabled = false;
          });
          return;
        }
        var btn = event.target && event.target.closest && event.target.closest('[data-card-action]');
        if (!btn) return;
        var id = btn.getAttribute('data-card-id');
        var action = btn.getAttribute('data-card-action');
        if (action === 'delete') {
          api.deleteCard(id).then(function () { window.location.reload(); });
          return;
        }
        if (action === 'toggle') {
          api.updateCard({ id: id, suspended: btn.getAttribute('data-suspended') !== '1' }).then(function () {
            window.location.reload();
          });
        }
      };
      return;
    }

    var listedPair = await Promise.all([
      api.listSets(),
      api.reviewOverview().catch(function () { return { sets: [] }; })
    ]);
    var sets = listedPair[0].sets || [];
    var dueById = {};
    (listedPair[1].sets || []).forEach(function (entry) {
      dueById[entry.id] = entry.dueCount || 0;
    });
    node.innerHTML =
      '<p class="lbl">New Study Set</p>' +
      '<input id="app-set-title" maxlength="120" placeholder="ENEM — Química">' +
      '<textarea id="app-set-desc" maxlength="1000" placeholder="Optional description"></textarea>' +
      '<button type="button" id="app-set-create">Create Study Set</button>' +
      '<p class="lbl">Your sets</p>' +
      (sets.length
        ? sets.map(function (entry) {
          var due = dueById[entry.id] != null ? dueById[entry.id] : 0;
          return '<a class="lc-doc-card app-module-row" href="' + escapeHtml(setHref(entry.id)) + '"><div>' +
            '<div class="lbl">' + escapeHtml(entry.title) + '</div>' +
            '<div class="v">' + escapeHtml(String(due) + ' cards due') + '</div></div></a>';
        }).join('')
        : '<div class="app-study-empty">Create a set, then add saved library items.</div>');
    var createBtn = $('app-set-create');
    if (createBtn) {
      createBtn.addEventListener('click', function () {
        api.createSet({
          title: ($('app-set-title') || {}).value,
          description: ($('app-set-desc') || {}).value
        }).then(function (data) {
          if (data && data.set && data.set.id) window.location.replace(setHref(data.set.id));
        }).catch(function (err) {
          window.alert((err && err.message) || 'Could not create this set.');
        });
      });
    }
  }

  async function renderReviewSection(node, api) {
    var setId = studySetIdFromQuery();
    var overview = await api.reviewOverview();
    var start = String(new URLSearchParams(location.search).get('start') || '');
    if (start === '1' || setId) {
      var queue = await api.reviewQueue(setId ? { setId: setId, limit: 20 } : { limit: 20 });
      var title = 'Smart Review';
      if (setId && overview.sets) {
        var found = overview.sets.find(function (entry) { return entry.id === setId; });
        if (found) title = found.title;
      }
      startReviewSession(queue, title);
      return;
    }
    var sets = overview.sets || [];
    node.innerHTML =
      '<div class="lc-doc-cards">' +
      card('due now', String(overview.dueNow || 0)) +
      card('new cards', String(overview.newCards || 0)) +
      card('total cards', String(overview.totalCards || 0)) +
      card('mastered', String(overview.masteredCards || 0)) +
      card('reviews (7d)', String(overview.reviewsLast7Days || 0)) +
      '</div>' +
      '<p><a class="lc-doc-card app-module-row" href="/app?section=review&start=1"><div><div class="lbl">Review all due cards</div><div class="v">' +
      escapeHtml(String(overview.dueNow || 0) + ' cards due') +
      '</div></div></a></p>' +
      '<p class="lbl">Study Sets</p>' +
      (sets.length
        ? sets.map(function (entry) {
          return '<a class="lc-doc-card app-module-row" href="' + escapeHtml(reviewHref(entry.id)) + '"><div>' +
            '<div class="lbl">' + escapeHtml(entry.title) + '</div>' +
            '<div class="v">' + escapeHtml(String(entry.dueCount || 0) + ' cards due') + '</div></div></a>';
        }).join('')
        : '<div class="app-study-empty">Create a Study Set to start reviewing.</div>');
  }

  async function loadStudyCloud(user) {
    renderStudyNav();
    var node = $('app-study');
    if (!node) return;
    if (!user || !user.isPro) {
      showStudyLocked(node, { upgradeUrl: '/pricing' });
      return;
    }
    var api = window.AtomurusStudy;
    if (!api) {
      node.innerHTML = '<div class="app-study-empty">Study Cloud client is unavailable.</div>';
      return;
    }
    var section = studySection();
    try {
      if (section === 'overview') {
        var overviewPair = await Promise.all([api.overview(), api.reviewOverview().catch(function () { return null; })]);
        var overview = overviewPair[0];
        var review = overviewPair[1];
        var counts = overview.counts || {};
        var dueNow = review && review.dueNow != null ? review.dueNow : 0;
        node.innerHTML =
          '<div class="lc-doc-cards">' +
          card('saved items', String(counts.items || 0)) +
          card('notes', String(counts.notes || 0)) +
          card('in progress', String(counts.inProgress || 0)) +
          card('calculator runs', String(counts.calculator || 0)) +
          (review ? card('cards due', String(dueNow)) : '') +
          (review ? card('study sets', String((review.sets || []).length)) : '') +
          (review ? card('flashcards', String(review.totalCards || 0)) : '') +
          (review ? card('mastered', String(review.masteredCards || 0)) : '') +
          '</div>' +
          (review && dueNow
            ? '<p class="lbl">' + escapeHtml(String(dueNow) + ' cards due') + '</p><a class="lc-doc-card app-module-row" href="/app?section=review&start=1"><div><div class="lbl">Review now</div><div class="v">Start Smart Review</div></div></a>'
            : '') +
          '<p class="lbl">Continue studying</p>' +
          (overview.continueStudying && overview.continueStudying.length
            ? overview.continueStudying.map(progressCard).join('')
            : '<div class="app-study-empty">Nothing in progress yet.</div>') +
          '<p class="lbl">Recent library</p>' +
          (overview.recentItems && overview.recentItems.length
            ? overview.recentItems.map(itemCard).join('')
            : '<div class="app-study-empty">Save an element, molecule or article to fill this shelf.</div>');
        return;
      }
      if (section === 'library') {
        var library = await api.items({ exclude: 'calculator', limit: 40 });
        node.innerHTML = (library.items && library.items.length
          ? library.items.map(libraryRow).join('')
          : '<div class="app-study-empty">Your library is empty.</div>') +
          '<div id="app-library-picker" class="app-study-empty" hidden></div>';
        bindLibrarySetActions(node, api);
        return;
      }
      if (section === 'sets') {
        await renderSetsSection(node, api);
        return;
      }
      if (section === 'review') {
        await renderReviewSection(node, api);
        return;
      }
      if (section === 'history') {
        var history = await api.items({ type: 'calculator', limit: 40 });
        node.innerHTML = history.items && history.items.length
          ? history.items.map(itemCard).join('')
          : '<div class="app-study-empty">No calculator runs saved yet.</div>';
        return;
      }
      if (section === 'notes') {
        var notes = await api.items({ hasNote: '1', limit: 40 });
        node.innerHTML = notes.items && notes.items.length
          ? notes.items.map(itemCard).join('')
          : '<div class="app-study-empty">No notes yet.</div>';
        return;
      }
      var progress = await api.progressList({ limit: 40 });
      node.innerHTML = progress.items && progress.items.length
        ? progress.items.map(progressCard).join('')
        : '<div class="app-study-empty">No study progress yet.</div>';
    } catch (err) {
      if (err && (err.status === 401 || err.code === 'session_expired')) throw err;
      if (err && (err.status === 403 || err.code === 'feature_locked')) {
        showStudyLocked(node, err);
        return;
      }
      node.innerHTML = '<div class="app-study-empty">' + escapeHtml((err && err.message) || 'Could not load Study Cloud.') + '</div>';
    }
  }

  async function loadWorkspace() {
    var client = auth();
    if (!client) {
      window.location.replace('/login?next=' + encodeURIComponent('/app'));
      return;
    }
    try {
      await client.requireSession({ next: workspaceNext() });
      var me = { user: client.getCurrentUser() };
      renderAccount(me);
      var dash = await fetchJson('/api/private/dashboard');
      renderDashboard(dash);
      await loadStudyCloud(me.user);
      var loading = $('app-loading');
      if (loading) loading.style.display = 'none';
      markReady();
    } catch (err) {
        if (err && (err.status === 401 || err.status === 404 || err.code === 'session_expired')) {
        client.redirectToLogin(workspaceNext());
        return;
      }
      showError();
    }
  }

  function boot() {
    initLogout();
    void loadWorkspace();
  }

  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    var client = auth();
    if (!client) return;
    client.getSession({ force: true }).then(function (session) {
      if (!session.signedIn) client.redirectToLogin(workspaceNext());
    }).catch(function (err) {
      if (err && (err.status === 0 || err.code === 'network' || err.status >= 500)) return;
      client.redirectToLogin(workspaceNext());
    });
  });

  document.addEventListener('DOMContentLoaded', boot);
})();
