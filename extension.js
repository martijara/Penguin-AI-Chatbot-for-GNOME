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
        this.timeoutCopy = null
        this.timeoutResponse = null


        // --- EXTENSION FOOTER
        this.chatInput = new St.Entry({
            hint_text: "Chat with me",
            can_focus: true,
            track_hover: true,
            style_class: 'messageInput'
        });

        this.chatInput.clutter_text.connect('activate', (actor) => {
            if (this.timeoutResponse) {
                GLib.Source.remove(this.timeoutResponse);
                this.timeoutResponse = null;
            }

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

            this.timeoutResponse = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, () => { 
                if (this.chatInput.get_text("I am Thinking...")) {
                    let response = "Connection time out. Check your internet connection.";

                    this.initializeTextBox('llmMessage', response);
                    this.chatInput.set_reactive(true)
                    this.chatInput.set_text("")

                    if (this.timeoutResponse) {
                        GLib.Source.remove(this.timeoutResponse);
                        this.timeoutResponse = null;
                    }
                }
                else {
                    if (this.timeoutResponse) {
                        GLib.Source.remove(this.timeoutResponse);
                        this.timeoutResponse = null;
                    }
                }
                });
            
        });

        this.newConversation = new St.Button({ 
            style: "width: 16px; height:16px; margin-right: 15px; margin-left: 10px'",
        
            child: new St.Icon({
                icon_name: 'tab-new-symbolic',
                style: 'width: 30px; height:30px'}) 
        });

        this.newConversation.connect('clicked', (actor) => {
            if (this.chatInput.get_text() == "Create a new conversation (Deletes current)") {
                this.history = []

                this.chatBox.destroy_all_children()
            }
            else {

                this.initializeTextBox('llmMessage', "You can't create a new conversation while I am thinking");
            }
        });

        this.newConversation.connect('enter-event', (actor) => {
            if (this.chatInput.get_text() == "") {
                this.chatInput.set_reactive(false)
                this.chatInput.set_text("Create a new conversation (Deletes current)")
            }
        });

        this.newConversation.connect('leave-event', (actor) => {
            if (this.chatInput.get_text() == "Create a new conversation (Deletes current)") {
                this.chatInput.set_reactive(true)
                this.chatInput.set_text("")
            }
        });


        let entryBox = new St.BoxLayout({
            vertical: false,
            style_class: 'popup-menu-box'
        });

        entryBox.add_child(this.chatInput);
        entryBox.add_child(this.newConversation);




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


        // tab-new-symbolic
        

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
                let response = "Hmm... It seems like your API key is not present or is incorrect. You can type it here or in the extension settings. Click below to enter your API key and view the guide on how to get one.";

                let final = convertMD(response);
                this.initializeTextBox('llmMessage', final);

                let settingsButton = new St.Button({
                    label: "Click here to set up your API for connecting to the chatbot", can_focus: true,  toggle_mode: true
                });
                
                settingsButton.connect('clicked', (self) => {
                    this.openSettings();
                });

                this.chatBox.add_child(settingsButton)

                this.chatInput.set_reactive(true)
                this.chatInput.set_text("")
                return;
            }
            if(res.error?.code != 401 && res.error !== undefined){
                let response = "Oh no! It seems like the LLM model you entered is either down or not correct. Make sure you didn't make any errors when inputting it in the settings. You can always use the default extension model (sent in the next message). Check your connection either way";

                this.initializeTextBox('llmMessage', response);
                this.initializeTextBox('llmMessage', "mattshumer/reflection-70b:free");

                let settingsButton = new St.Button({
                    label: "Click here to check or change your model ID", can_focus: true,  toggle_mode: true
                });
        
                settingsButton.connect('clicked', (self) => {
                    this.openSettings();
                });

                this.chatBox.add_child(settingsButton)

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
        let box = new St.BoxLayout({
            vertical: true,
            style_class: `${type}-box`
        });
        
        // text has to be a string
        let label = new St.Label({
            style_class: type,
            y_expand: true,
            reactive: true
        });

        label.clutter_text.single_line_mode = false;
        label.clutter_text.line_wrap        = true;
        label.clutter_text.line_wrap_mode   = Pango.WrapMode.WORD_CHAR;
        label.clutter_text.ellipsize        = Pango.EllipsizeMode.NONE;

        box.add_child(label)

        if(type != 'humanMessage') {
            label.connect('button-press-event', (actor) => {
                this.extension.clipboard.set_text(St.ClipboardType.CLIPBOARD, label.clutter_text.get_text());
            });
            
            

            label.connect('enter-event', (actor) => {

                
                if (this.chatInput.get_text() != "I am Thinking...") {
                    this.timeoutCopy = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 0.4, () => { 
                        this.chatInput.set_reactive(false);
                        this.chatInput.set_text("Click on text to copy");});
                }
            });

            label.connect('leave-event', (actor) => {
                if (this.timeoutCopy) {
                    GLib.Source.remove(this.timeoutCopy);
                    this.timeoutCopy = null;
                }

                if (this.chatInput.get_text() != "I am Thinking...") {
                    this.chatInput.set_reactive(true);
                    this.chatInput.set_text("");
                }
            });
            
        } 

        label.clutter_text.set_markup(text);
        this.chatBox.add_child(box);
    }

    openSettings () {
        this.extension.openSettings();
    }

    destroy() {
        if (this.timeoutCopy) {
            GLib.Source.remove(this.timeoutCopy);
            this.timeoutCopy = null;
        }

        if (this.timeoutResponse) {
            GLib.Source.remove(this.timeoutResponse);
            this.timeoutResponse = null;
        }

        this._httpSession?.abort(); // <- Don't forget to make the session instance avaialable to the class
        super.destroy();
    }
    
});


export default class PenguinExtension extends Extension {
    enable() {
        this._penguin = new Penguin({
            settings: this.getSettings(),
            clipboard: St.Clipboard.get_default(),
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


