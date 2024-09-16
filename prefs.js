// Made by @coffeecionado 

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PenguinPreferences extends ExtensionPreferences {
    fillPreferencesWindow (window) {
        window._settings = this.getSettings();
        const settingsUI = new Settings(window._settings);
        const page = new Adw.PreferencesPage();
        page.add(settingsUI.ui);
        window.add(page);
    }
}

class Settings {
    constructor (schema) {
        this.schema = schema;
        this.ui =  new Adw.PreferencesGroup({ title: _('Settings:') });
        this.main = new Gtk.Grid({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            row_spacing: 10,
            column_spacing: 14,
            column_homogeneous: false,
            row_homogeneous: false
        });
        const defaultKey = this.schema.get_string("open-router-api-key");
        const defaulModel = this.schema.get_string("llm-model");


        const labelAPI = new Gtk.Label({
            label: _("OpenRouter API Key"),
            halign: Gtk.Align.START
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });
        const howToAPI = new Gtk.LinkButton({
            label: _("How to get API key?"),
            uri: 'https://coffeecionado.gitlab.io/Penguin-AI-Chatbot-for-GNOME/'
        });


        const labelModel = new Gtk.Label({
            label: _("LLM model you want to use"),
            halign: Gtk.Align.START
        });
        const model = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });
        const howToModel = new Gtk.LinkButton({
            label: _("List of models"),
            uri: 'https://openrouter.ai/docs/models'
        });

        
        const save = new Gtk.Button({
            label: _('Save')
        });
        const statusLabel = new Gtk.Label({
            label: "Not yet saved. Click on the Save button above for your preferences to be saved",
            useMarkup: true,
            halign: Gtk.Align.CENTER
        });

        apiKey.set_text(defaultKey);
        model.set_text(defaulModel)

        save.connect('clicked', () => {
            this.schema.set_string("open-router-api-key", apiKey.get_buffer().get_text());
            this.schema.set_string("llm-model", model.get_buffer().get_text());
            statusLabel.set_markup(_("Saved"));
        });

        // col, row, 1, 1
        this.main.attach(labelAPI, 0, 0, 1, 1);
        this.main.attach(apiKey, 2, 0, 2, 1);
        this.main.attach(howToAPI, 4, 0, 2, 1);

        this.main.attach(labelModel, 0, 1, 1, 1);
        this.main.attach(model, 2, 1, 2, 1);
        this.main.attach(howToModel, 4, 1, 2, 1);

        this.main.attach(save, 2, 5, 1, 1);
        this.main.attach(statusLabel, 0, 6, 4, 1);

        this.ui.add(this.main);
    }
}