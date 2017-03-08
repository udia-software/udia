/////////////////////////////////////////////////////////////////////////////
// The contents of this file are subject to the Common Public Attribution
// License Version 1.0. (the "License"); you may not use this file except in
// compliance with the License. You may obtain a copy of the License at
// https://raw.githubusercontent.com/udia-software/udia/master/LICENSE.
// The License is based on the Mozilla Public License Version 1.1, but
// Sections 14 and 15 have been added to cover use of software over a computer
// network and provide for limited attribution for the Original Developer.
// In addition, Exhibit A has been modified to be consistent with Exhibit B.
//
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
// the specific language governing rights and limitations under the License.
//
// The Original Code is UDIA.
//
// The Original Developer is the Initial Developer.  The Initial Developer of
// the Original Code is Udia Software Incorporated.
//
// All portions of the code written by UDIA are Copyright (c) 2016-2017
// Udia Software Incorporated. All Rights Reserved.
///////////////////////////////////////////////////////////////////////////
import { Presence } from "phoenix"

let Post = {
    init(socket, element) {
        if (!element) {
            return
        }
        let postId = element.getAttribute("data-id")
        socket.connect()
        this.onReady(postId, socket)
    },

    onReady(postId, socket) {
        let postChannel = socket.channel("posts:" + postId)
        let msgContainer = document.getElementById("msg-container")

        // These two elements only exist when the user is authenticated.
        let msgInput = document.getElementById("msg-input")
        let submitCommentButton = document.getElementById("msg-submit")

        // Submit a comment
        if (submitCommentButton) {
            submitCommentButton.addEventListener("click", e => {
                let payload = { body: msgInput.value }
                postChannel.push("new_comment", payload)
                    .receive("error", e => console.log(e))
                msgInput.value = ""
            })
        }

        // On new comment, render in message container
        postChannel.on("new_comment", (resp) => {
            postChannel.params.last_seen_id = resp.id
            this.renderComment(msgContainer, resp)
        })

        // On join channel, get all comments
        postChannel.join()
            .receive("ok", resp => {
                let ids = resp.comments.map(comment => comment.id)
                if (ids.length > 0) {
                    postChannel.params.last_seen_id = Math.max(...ids)
                }
                resp.comments.filter(comment => {
                    this.renderComment(msgContainer, comment)
                })
            })
            .receive("error", reason => console.log("join failed", reason))

        let presences = {}

        postChannel.on("presence_state", state => {
            console.log("presence_state", state)
            Presence.syncState(presences, state)
            this.renderPresence(presences)
        })
        postChannel.on("presence_diff", diff => {
            console.log("presence_diff", diff)
            Presence.syncDiff(presences, diff)
            this.renderPresence(presences)
        })
    },

    esc(str) {
        let div = document.createElement("div")
        div.appendChild(document.createTextNode(str))
        return div.innerHTML
    },

    renderComment(msgContainer, { user, body }) {
        let template = document.createElement("div")
        template.innerHTML = `<a href="#"><b>${this.esc(user.username)}</b>: ${this.esc(body)}</a>`

        msgContainer.appendChild(template)
        msgContainer.scrollTop = msgContainer.scrollHeight
    },

    renderPresence(presences) {
        console.log("render_presence", presences)
        let userList = document.getElementById("user-list")
        let listBy = (id, { metas: [first, ...rest] }) => {
            first.name = id
            first.count = rest.length + 1
            return first
        }

        userList.innerHTML = Presence.list(presences, listBy)
            .map(user => `<li>${user.name} (${user.count})</li>`)
            .join("")
    }
}

export default Post