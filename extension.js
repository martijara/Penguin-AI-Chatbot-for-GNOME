/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
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

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        // --- INITIALIZATION AND ICON IN TOPBAR
        super._init(0.0, _('Llama Copilot'));
        
        this.add_child(new St.Icon({
            icon_name: 'Llama',
            style_class: 'llama-icon',
        }));
    
        
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
            style_class: 'chat-scrolling'
        });

        this.chatView.set_child(chatBox);



        // Button action script
        this.submitInput.connect('clicked', () => {
            let input = this.chatInput.get_text();
            console.log(input);

            this.messageDebug = new St.Label({
                text: input,
                style_class: 'humanMessage',
                y_expand: true
            });

            this.messageDebug.clutter_text.single_line_mode = false;
            this.messageDebug.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
    
            chatBox.add_child(this.messageDebug);
            this.chatView.set_child(chatBox);
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

        layout.add_child(descriptiveBox)
        layout.add_child(this.chatView)
        layout.add_child(entryBox);

        
        // --- ADDING EVERYTHING TOGETHER TO APPEAR AS A POP UP MENU
        let popUp = new PopupMenu.PopupMenuSection();
        popUp.actor.add_child(layout);
        this.menu.actor.add_style_class_name('note-entry')

        this.menu.addMenuItem(popUp)
    }
}
);


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


