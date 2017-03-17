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

let Category = {
    init(socket, elements) {
        if (!elements) { return }
        socket.connect()
        let ids = elements.map((k, v) => {
            let replaced = v.id.replace(/\D/g, "")
            return replaced
        })

        let posts = ids.filter((k, v) => {
            return ids[k] != ids[k + 1]
        })
        this.onReady(socket, posts.toArray())
    },

    onReady(socket, allId) {
        let categoryChannel = socket.channel("category:lobby", {ids: allId})

        allId.forEach(id => {

        let voteUpLink = document.getElementById("vote-up-link-" + id)
        let voteDownLink = document.getElementById("vote-down-link-" + id)
        let voteSpan = document.getElementById("vote-span-" + id)

        voteUpLink.addEventListener("click", e => {
            categoryChannel.push("up_vote", {id: id})
        })

        voteDownLink.addEventListener("click", e => {
            categoryChannel.push("down_vote", {id: id})
        })

        // Up vote event
        categoryChannel.on("up_vote", resp => {
            if (resp.post_id == id) {
                voteSpan.textContent = resp.point

                if (resp.id == window.userId) {

                    if (resp.value == 1) {
                        $(voteUpLink).addClass("green").removeClass("inverted");
                        $(voteDownLink).addClass("red").addClass("inverted");
                    } else {
                        $(voteUpLink).removeClass("green").removeClass("inverted");
                        $(voteDownLink).removeClass("red").removeClass("inverted");
                    }
                }
            }
        })

        // Down vote event
        categoryChannel.on("down_vote", resp => {
            if (resp.post_id == id) {
                voteSpan.textContent = resp.point

                if (resp.id == window.userId) {

                    if (resp.value == -1) {
                        $(voteUpLink).addClass("green").addClass("inverted");
                        $(voteDownLink).addClass("red").removeClass("inverted");
                    } else {
                        $(voteUpLink).removeClass("green").removeClass("inverted");
                        $(voteDownLink).removeClass("red").removeClass("inverted");
                    }
                }
            }
        })

        })

        categoryChannel.join()
            .receive("ok", resp => {

                resp.forEach(res => {

                    let voteUpLink = document.getElementById("vote-up-link-" + res.id)
                    let voteDownLink = document.getElementById("vote-down-link-" + res.id)
                    let voteSpan = document.getElementById("vote-span-" + res.id)
                    if (res.point == null) {
                        voteSpan.textContent = "0"
                    } else {
                        voteSpan.textContent = res.point
                    }

                    if (res.value == 1) {
                        $(voteUpLink).addClass("green").removeClass("inverted");
                        $(voteDownLink).addClass("red").addClass("inverted");
                    } else if (res.value == -1) {
                        $(voteDownLink).addClass("red").removeClass("inverted");
                        $(voteUpLink).addClass("green").addClass("inverted");
                    }
                })
            })
            .receive("error", resp => { console.log("failed to join", resp)})
    },
}

export default Category
