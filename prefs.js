// Made by @martijara 

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


        // Getting necessary schema values
        const defaultKey = this.schema.get_string("open-router-api-key");
        const defaulModel = this.schema.get_string("llm-model");
        const defaultHumanColor = this.schema.get_string("human-message-color");
        const defaultLLMColor = this.schema.get_string("llm-message-color");
        const defaultHumanTextColor = this.schema.get_string("human-message-text-color");
        const defaultLLMTextColor = this.schema.get_string("llm-message-text-color");


        // API Key Section
        const labelAPI = new Gtk.Label({
            label: _("OpenRouter API Key"),
            halign: Gtk.Align.START
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });
        
        const howToAPI = new Gtk.LinkButton({
            label: _("How to get API key?"),
            uri: 'https://martijara.gitlab.io/Penguin-AI-Chatbot-for-GNOME/'
        });


        // LLM Model Section
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


        // Color Dialog
        let colorDialog = new Gtk.ColorDialog({
            with_alpha: false,
        });

        // Human Color Section
        const labelHumanColor = new Gtk.Label({
            label: _("BACKGROUND Color of YOUR message"),
            halign: Gtk.Align.START
        });

        

        let humanColor = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: colorDialog,
        });

        const humanColorGTK = humanColor.rgba;
        humanColorGTK.parse(defaultHumanColor);
        humanColor.set_rgba(humanColorGTK);

        


        // LLM Color Section
        const labelLLMColor = new Gtk.Label({
            label: _("BACKGROUND Color of CHATBOT Message"),
            halign: Gtk.Align.START
        });



        let llmColor = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: colorDialog,
        });

        const llmColorGTK = llmColor.rgba;
        llmColorGTK.parse(defaultLLMColor);
        llmColor.set_rgba(llmColorGTK);



        // Human Text Color Section
        const labelHumanTextColor = new Gtk.Label({
            label: _("TEXT Color of YOUR message"),
            halign: Gtk.Align.START
        });

        let humanTextColor = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: colorDialog,
        });

        const humanTextColorGTK = humanTextColor.rgba;
        humanTextColorGTK.parse(defaultHumanTextColor);
        humanTextColor.set_rgba(humanTextColorGTK);

        


        // LLM Text Color Section
        const labelLLMTextColor = new Gtk.Label({
            label: _("TEXT Color of the CHATBOT Message"),
            halign: Gtk.Align.START
        });


        let llmTextColor = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: colorDialog,
        });

        const llmTextColorGTK = llmTextColor.rgba;
        llmTextColorGTK.parse(defaultLLMTextColor);
        llmTextColor.set_rgba(llmTextColorGTK);



        
        const save = new Gtk.Button({
            label: _('Save')
        });
        const statusLabel = new Gtk.Label({
            label: "Not yet saved. Click on the Save button above for your preferences to be saved",
            useMarkup: true,
            halign: Gtk.Align.CENTER
        });

        // Initial display of set values
        apiKey.set_text(defaultKey);
        model.set_text(defaulModel);


        save.connect('clicked', () => {
            this.schema.set_string("open-router-api-key", apiKey.get_buffer().get_text());
            this.schema.set_string("llm-model", model.get_buffer().get_text());
            this.schema.set_string("human-message-color", `${humanColor.get_rgba().to_string()}`);
            this.schema.set_string("llm-message-color", `${llmColor.get_rgba().to_string()}`);
            this.schema.set_string("human-message-text-color", `${humanTextColor.get_rgba().to_string()}`);
            this.schema.set_string("llm-message-text-color", `${llmTextColor.get_rgba().to_string()}`);
            statusLabel.set_markup(_("Saved"));
        });

        // Displaying everything
        // col, row, 1, 1
        this.main.attach(labelAPI, 0, 0, 1, 1);
        this.main.attach(apiKey, 2, 0, 2, 1);
        this.main.attach(howToAPI, 4, 0, 2, 1);

        this.main.attach(labelModel, 0, 1, 1, 1);
        this.main.attach(model, 2, 1, 2, 1);
        this.main.attach(howToModel, 4, 1, 2, 1);

        this.main.attach(labelHumanColor, 0, 2, 1, 1);
        this.main.attach(humanColor, 2, 2, 2, 1);

        this.main.attach(labelHumanTextColor, 0, 3, 1, 1);
        this.main.attach(humanTextColor, 2, 3, 2, 1);

        this.main.attach(labelLLMColor, 0, 4, 1, 1);
        this.main.attach(llmColor, 2, 4, 2, 1);

        this.main.attach(labelLLMTextColor, 0, 5, 1, 1);
        this.main.attach(llmTextColor, 2, 5, 2, 1);

        this.main.attach(save, 2, 8, 1, 1);
        this.main.attach(statusLabel, 0, 9, 4, 1);

        this.ui.add(this.main);
    }
}