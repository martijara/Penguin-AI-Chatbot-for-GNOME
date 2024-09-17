// Made by @coffeecionado


// Importing necessary libraries
import GObject from 'gi://GObject';
import St from 'gi://St';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import Pango from 'gi://Pango';
import {convertMD} from "./md2pango.js";

import * as Main from 'resource:///org/gnome/shell/ui/main.js';


// Defining necessary variables (OpenRouter API)
let OPENROUTER_API_KEY = ""
let OPENROUTER_CHABOT_MODEL = "" 
let url = `https://openrouter.ai/api/v1/chat/completions`;


// Class that activates the extension
const Penguin = GObject.registerClass(
class Penguin extends PanelMenu.Button 
{
    
    _loadSettings () {
        this._settingsChangedId = this.extension.settings.connect('changed', () => {
            this._fetchSettings();
            this._initFirstResponse();
        });
        this._fetchSettings();
    }

    _fetchSettings () {
        const { settings } = this.extension;
        OPENROUTER_API_KEY           = settings.get_string("open-router-api-key");
        OPENROUTER_CHABOT_MODEL          = settings.get_string("llm-model");
    }

    _init(extension) {
        // --- INITIALIZATION AND ICON IN TOPBAR
        super._init(0.0, _('Penguin: AI Chatbot'));
        this.extension = extension
        this._loadSettings();

        this.add_child(new St.Icon({
            icon_name: 'Penguin: AI Chatbot',
            style_class: 'icon',
        }));


        // ... INITIALIZATION OF SESSION VARIABLES
        this.history = []
        this._httpSession = new Soup.Session();


        // --- EXTENSION FOOTER
        this.chatInput = new St.Entry({
            hint_text: "Chat with me",
            can_focus: true,
            track_hover: true,
            style_class: 'messageInput',
            style: 'margin-left: 8px; margin-right: 8px; margin-top: 8px;',
            y_expand: true
        });

        this.chatInput.clutter_text.connect('activate', (actor) => {
            log("Enter clicked")

            let input = this.chatInput.get_text();

            
            this.initializeTextBox('humanMessage', input)

            // Add input to chat history
            this.history.push({
                "role": "user",
                "content": input
            });

            this.openRouterChat();

            this.chatInput.set_reactive(false)
            this.chatInput.set_text("I am Thinking...")
        });

        // --- EXTENSION BODY
        this.chatBox = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box',
            style: 'text-wrap: wrap'
        });

        this.chatView = new St.ScrollView({
            enable_mouse_scrolling: true,
            style_class: 'chat-scrolling',
            reactive: true
        });

        this.chatView.set_child(this.chatBox);


    
        let entryBox = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box'
        });

        entryBox.add_child(this.chatInput);


        

        // --- EXTENSION PARENT BOX LAYOUT

        let layout = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box'
        });

        layout.add_child(this.chatView);
        layout.add_child(entryBox);

        
        // --- ADDING EVERYTHING TOGETHER TO APPEAR AS A POP UP MENU
        let popUp = new PopupMenu.PopupMenuSection();
        popUp.actor.add_child(layout);

        this.menu.addMenuItem(popUp);
    };

    openRouterChat() {
        let message = Soup.Message.new('POST', url);
        
        message.request_headers.append(
                'Authorization',
                `Bearer ${OPENROUTER_API_KEY}`
        )


        let body = JSON.stringify({"model": OPENROUTER_CHABOT_MODEL, "messages": this.history});
        let bytes  = GLib.Bytes.new(body);


        message.set_request_body_from_bytes('application/json', bytes);
        this._httpSession.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_httpSession, result) => {
            let bytes = _httpSession.send_and_read_finish(result);
            let decoder = new TextDecoder('utf-8');
            let response = decoder.decode(bytes.get_data());
            let res = JSON.parse(response);

            log(res);
            log(url);

            if (res.error?.code == 401) {
                let response = "Hmm... It seems like your API key is not present. You can type it here or in the extension settings. Click below to enter your API key and view the guide on how to get one.";

                let final = convertMD(response);
                this.initializeTextBox('llmMessage', final);

                let settingsButton = new St.Button({
                    label: "Click here to set up your API for connecting to the chatbot", can_focus: true,  toggle_mode: true});
        
                settingsButton.connect('clicked', (self) => {
                    log("Hi, working?");
                    this.openSettings();
                });

                this.chatBox.add_child(settingsButton)

                this.chatInput.set_reactive(true)
                this.chatInput.set_text("")
                return;
            }
            if(res.error?.code != 401 && res.error !== undefined){
                let response = "Error, try another model or check your connection";

                this.initializeTextBox('llmMessage', response);
                this.chatInput.set_reactive(true)
                this.chatInput.set_text("")
            }
            else {
                let response = res.choices[0].message.content;
                
                let final = convertMD(response);
                this.initializeTextBox('llmMessage', final);

                // Add input to chat history
                this.history.push({
                    "role": "assistant",
                    "content": response
                });

                this.chatInput.set_reactive(true)
                this.chatInput.set_text("")
            }
        });

    }

    initializeTextBox(type, text) {
        // text has to be a string
        let label = new St.Label({
            style_class: type,
            y_expand: true
        });

        label.clutter_text.single_line_mode = false;
        label.clutter_text.line_wrap        = true;
        label.clutter_text.line_wrap_mode   = Pango.WrapMode.WORD_CHAR;
        label.clutter_text.ellipsize        = Pango.EllipsizeMode.NONE;

        label.clutter_text.set_markup(text);
        this.chatBox.add_child(label);
    }

    openSettings () {
        this.extension.openSettings();
    }

    destroy() {
        this._httpSession?.abort(); // <- Don't forget to make the session instance avaialable to the class
        super.destroy();
    }
    
});


export default class PenguinExtension extends Extension {
    enable() {
        this._penguin = new Penguin({
            settings: this.getSettings(),
            openSettings: this.openPreferences,
            uuid: this.uuid
        });

        Main.panel.addToStatusArea(this.uuid, this._penguin);
    }
    disable() {
        this._penguin.destroy();
        this._penguin = null;
    }
}


