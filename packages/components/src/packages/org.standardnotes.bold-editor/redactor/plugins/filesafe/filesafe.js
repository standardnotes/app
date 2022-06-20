(function($R)
{
    $R.add('plugin', 'filesafe', {
        modals: {
            'filesafe':
                 '<div id="filesafe-react-client"> \
                 </div>'
        },
        translations: {
            en: {
                "filesafe": "FileSafe",
                "filesafe-label": "Please, type some text"
            }
        },
        init: function(app)
        {
            // define app
            this.app = app;
            this.filesafe = window.filesafe_params;
            this.lang = app.lang;
            this.toolbar = app.toolbar;
            this.insertion = app.insertion;
        },

        // messages
        onmodal: {
            filesafe: {
                opened: function($modal, $form)
                {
                  const mountPoint = document.getElementById('filesafe-react-client');
                  this.filesafe.embed.FilesafeEmbed.renderInElement(mountPoint, this.filesafe.client);
                },
                closed: function()
                {
                  const mountPoint = document.getElementById('filesafe-react-client');
                  this.filesafe.embed.FilesafeEmbed.unload(mountPoint);
                }
            }
        },

        // public
        start: function()
        {
            // create the button data
            var buttonData = {
                title: 'FileSafe',
                api: 'plugin.filesafe.open'
            };

            // create the button
            var $button = this.toolbar.addButton('filesafe', buttonData);
            $button.setIcon('<i class="re-icon-clips"></i>');
        },
        open: function()
        {
            var options = {
                title: this.lang.get('filesafe'),
                width: '600px',
                height: '500px',
                name: 'filesafe',
                commands: {
                  // cancel: { title: "Done" }
                }
            };

            this.app.api('module.modal.build', options);
        },

    });
})(Redactor);
