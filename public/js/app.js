/* global jQuery */
!(function (window, $, undefined) { // eslint-disable-line
  var cheatsheetShown = false

  var proxyPath

  var EverHopeful = {

    init: function (setProxyPath) {
      proxyPath = setProxyPath

      var navh = $('.navbar').height()
      var qs
      var hl = null

      if (window.location.search !== '') {
        $('input[name=term]').focus()
        qs = $.map(window.location.search.substr(1).split('&'), function (kv) {
          kv = kv.split('=')
          return { k: kv[0], v: decodeURIComponent(kv[1]) }
        })
        $.each(qs, function (i, t) {
          if (t.k === 'hl') {
            hl = t.v
          }
        })
        if (hl) {
          if (window.find && window.getSelection) {
            document.designMode = 'on'
            var sel = window.getSelection()
            sel.collapse(document.body, 0)
            while (window.find(hl)) {
              document.execCommand('HiliteColor', false, 'yellow')
              sel.collapseToEnd()
            }
            sel.collapse(document.body, 0)
            window.find(hl)
            sel.collapseToEnd()
            document.designMode = 'off'
          } else {
            if (document.body.createTextRange) {
              var textRange = document.body.createTextRange()
              while (textRange.findText(hl)) {
                textRange.execCommand('BackColor', false, 'yellow')
                textRange.collapse(false)
              }
            }
          }
        }
      }

      $('#js--login').attr('href', function () {
        return $(this).attr('href').replace('destination', 'destination=' + encodeURIComponent(window.location.pathname))
      })

      $('.confirm-delete-page').on('click', function (evt) {
        return window.confirm('Do you really want to delete this page?')
      })

      $('.confirm-revert').on('click', function (evt) {
        return window.confirm('Do you really want to revert to this revision?')
      })

      var $hCol1 = $('.history td:first-child')

      if ($('js--content').hasClass('edit')) {
        $('#js--editor').focus()
      } else {
        $('#js--pageTitle').focus()
      }

      $('#js--rev-compare').attr('disabled', true)

      toggleCompareCheckboxes()
      $hCol1.find('input').on('click', function () {
        toggleCompareCheckboxes()
      })

      $('#js--rev-compare').on('click', function () {
        if ($hCol1.find(':checked').length < 2) {
          return false
        }
        window.location.href = proxyPath + '/compare/' + $hCol1.find(':checked').map(function () { return $(this).val() }).toArray().reverse().join('..') + '/' + $(this).data('pagename')
        return false
      })

      if (/^\/pages\/edit\/.*/.test(window.location.pathname) ||
          /^\/pages\/new/.test(window.location.pathname)) {
        $('#js--editor').closest('form').on('submit', function () {
          if (EverHopeful.cmInstance) {
            EverHopeful.cmInstance.save()
          }
          window.sessionStorage.setItem('ever-hopeful-page', $('#js--editor').val())
        })
        if (window.location.search === '?e=1') {
          // Edit page in error: restore the body
          var content = window.sessionStorage.getItem('ever-hopeful-page')
          if (content) {
            $('#js--editor').val(content)
          }
        } else {
          window.sessionStorage.removeItem('ever-hopeful-page')
        }
      }

      if (/^\/wiki\//.test(window.location.pathname)) {
        markMissingPagesAsAbsent('#js--content')
      }

      function toggleCompareCheckboxes () {
        $('#js--rev-compare').attr('disabled', true)

        if ($hCol1.find(':checkbox').length === 1) {
          $hCol1.find(':checkbox').hide()
          return
        }
        if ($hCol1.find(':checked').length === 2) {
          $('#js--rev-compare').attr('disabled', false)
          $hCol1.find(':not(:checked)')
                .hide()
          $hCol1.parent('tr')
                .css({'color': 'silver'})
          $hCol1.find(':checked')
                .parents('tr')
                .css({'color': 'black'})
        } else {
          $hCol1.find('input')
                .show()
                .parents('tr')
                .css({'color': 'black'})
        }
      }
    },

    preview: function () {
      $('#js--preview').modal({keyboard: true, show: true, backdrop: false})
      $.post(proxyPath + '/misc/preview', {data: $('#js--editor').val()}, function (data) {
        $('#js--preview .modal-body').html(data).get(0).scrollTop = 0
        markMissingPagesAsAbsent('#js--preview .modal-body')
      })
    },

    save: function () {
      $('form.edit').submit()
    },

    upload: function () {
      $('#js--upload').modal({keyboard: true, show: true, backdrop: false})
      $.get(proxyPath + '/misc/upload', function (data) {
        $('#js--upload .modal-body').html(data).get(0).scrollTop = 0
      })
    },

    toggleFullscreen: function () {
      var isFullscreen = EverHopeful.cmInstance.getOption('fullScreen')

      EverHopeful.cmInstance.setOption('fullScreen', !EverHopeful.cmInstance.getOption('fullScreen'))
      EverHopeful.cmInstance.focus()

      $('ul.toolbar').toggleClass('fullscreen', !isFullscreen)
    },

    toolbar: function () {
      $('ul.toolbar').on('click', 'li', function () {
        if (this.className === 'info') {
          EverHopeful.markdownSyntax()
        }
        if (this.className === 'preview') {
          EverHopeful.cmInstance.save()
          EverHopeful.preview()
        }
        if (this.className === 'fullscreen') {
          EverHopeful.toggleFullscreen()
        }
        if (this.className === 'upload') {
          EverHopeful.upload()
        }
      })
    },

    markdownSyntax: function () {
      $('#js--syntax-reference').modal({keyboard: true, show: true, backdrop: false})
      if (!cheatsheetShown) {
        $('#js--syntax-reference .modal-body').load(proxyPath + '/misc/syntax-reference')
        cheatsheetShown = true
      }
    }
  }

  function markMissingPagesAsAbsent (selector) {
    var pages = []
    var match
    var href

    $(selector + ' a.internal').each(function (i, a) {
      href = $(a).attr('href')
      href = href.slice(proxyPath.length)
      match = /\/wiki\/(.+)/.exec(href)
      if (match) {
        pages.push(decodeURIComponent(match[1]))
      }
    })

    $.getJSON(proxyPath + '/misc/existence', {data: pages}, function (result) {
      $.each(result.data, function (href, a) {
        $(selector + " a[href='" + proxyPath.split('/').join('\\/') + '\\/wiki\\/' + encodeURIComponent(a) + "']").addClass('absent')
      })
    })
  }

  window.EverHopeful = EverHopeful
}(this, jQuery))
