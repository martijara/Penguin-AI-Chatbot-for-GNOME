// extension.js - Controls GNOME Extensions behavior


// Importing necessary libraries
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';

import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import Shell from 'gi://Shell';
import System from 'system';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import Pango from 'gi://Pango';
import * as BoxPointer from 'resource:///org/gnome/shell/ui/boxpointer.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';


// Defining necessary variables (OpenRouter API)
let OPENROUTER_API_KEY = ""
let OPENROUTER_CHABOT_MODEL = "mattshumer/reflection-70b:free"


// Class that activates the extension
const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button 
{
    _init() {
        // --- INITIALIZATION AND ICON IN TOPBAR
        super._init(0.0, _('Llama Copilot'));

        this.add_child(new St.Icon({
            icon_name: 'Llama',
            style_class: 'llama-icon',
        }));


        // ... INITIALIZATION OF SESSION VARIABLES
        this.history = []

        
        // --- EXTENSION HEADER
        let descriptiveBox = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box'
        });

        this.header = new St.Label({
            text: "Llama Copilot",
            style: 'text-align: center',
        });

        descriptiveBox.add_child(this.header);


        // --- EXTENSION FOOTER
        this.chatInput = new St.Entry({
            hint_text: "Chat with Llama",
            can_focus: true,
            track_hover: true,
            style_class: 'messageInput',
            style: 'margin-left: 8px; margin-right: 8px; margin-top: 8px;',
            y_expand: true
        });

        this.submitInput = new St.Button({
            label: "Send",
            style_class: 'icon-button',
            style: 'margin-top: 8px; margin-right: 8px; margin-left: 8px; margin-bottom: 8px; width: 250px; height: 10px !important; border-radius: 20px;',
            reactive: true,
            track_hover: true,
            can_focus: true
        });
        

        // --- EXTENSION BODY
        let chatBox = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box',
            style: 'text-wrap: wrap'
        });

        this.chatView = new St.ScrollView({
            enable_mouse_scrolling: true,
            style_class: 'chat-scrolling',
            reactive: true
        });

        this.chatView.set_child(chatBox);


        // Button action script
        this.submitInput.connect('clicked', () => {
            let input = this.chatInput.get_text();

            this.messageDebug = new St.Label({
                style_class: 'humanMessage',
                x_expand: true,
                y_expand: true,
                reactive: true
            });


            // Add a message to the body chat
            this.messageDebug.clutter_text.set_markup(`${input}`);
            this.messageDebug.clutter_text.single_line_mode = false;
            this.messageDebug.clutter_text.line_wrap        = true;
            this.messageDebug.clutter_text.line_wrap_mode   = Pango.WrapMode.WORD_CHAR;
            this.messageDebug.clutter_text.ellipsize        = Pango.EllipsizeMode.NONE;
    
            chatBox.add_child(this.messageDebug);
            this.chatView.set_child(chatBox);

            // Add input to chat history
            this.history.push({
                "role": "user",
                "content": input
            });

            console.debug(this.openRouterChat());
        });

        let entryBox = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box'
        });

        entryBox.add_child(this.chatInput);
        entryBox.add_child(this.submitInput);
        

        // --- EXTENSION PARENT BOX LAYOUT

        let layout = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box'
        });

        layout.add_child(descriptiveBox);
        layout.add_child(this.chatView);
        layout.add_child(entryBox);

        
        // --- ADDING EVERYTHING TOGETHER TO APPEAR AS A POP UP MENU
        let popUp = new PopupMenu.PopupMenuSection();
        popUp.actor.add_child(layout);

        this.menu.addMenuItem(popUp);
    };

    openRouterChat() {
        let _httpSession = new Soup.Session();
        let url = `https://openrouter.ai/api/v1/chat/completions`;

        let response = 'Hi, Human'

        //if(newKey != undefined){
        //    this._settings.set_string("gemini-api-key", newKey);
        //    GEMINIAPIKEY = newKey;
        //}

        let message = Soup.Message.new('POST', url);
        
        message.request_headers.append(
                'Authorization',
                `Bearer ${OPENROUTER_API_KEY}`
        )


        let body = JSON.stringify({"model": OPENROUTER_CHABOT_MODEL, "messages": this.history});
        let bytes  = GLib.Bytes.new(body);
        //message.set_request_body_from_bytes('application/json', 2, body);
        //_httpSession.queue_message(message, async (_httpSession, message) =>  {
        //    response = JSON.stringify(JSON.parse(message.response_body.data));
            
            // let aiResponse = res.candidates[0]?.content?.parts[0]?.text;
        //    this.history.push({
        //        "role": "assistant",
        //        "content": "Hi"
        //    });
        //});

        message.set_request_body_from_bytes('application/json', bytes);
        _httpSession.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_httpSession, result) => {
            let bytes = _httpSession.send_and_read_finish(result);
            let decoder = new TextDecoder('utf-8');
            let response = decoder.decode(bytes.get_data());
            let res = JSON.parse(response);
            // Inspecting the response for dev purpose
            log(url)
            if(res.error?.code != 401 && res.error !== undefined){
                response = "Error, try another model or check your connection"
            }
            else {
                response = res.choices[0].message.content;
                log(response)
        
            }
        });
        
        return `response: ${response}`
        

    }
    
});


export default class IndicatorE extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }
    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}


