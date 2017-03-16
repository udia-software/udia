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
    init(socket, element) {
        if (!element) { return }
        socket.connect()
        let postId = element.getAttribute("data-id")
        this.onReady(socket, postId)
    },

    onReady(socket, postId) {
        let categoryChannel = socket.channel("category:lobby", {id: postId})
        let voteUpLink = document.getElementById("vote-up-link-" + postId)
        let voteDownLink = document.getElementById("vote-down-link-" + postId)
        let voteSpan = document.getElementById("vote-span")

        voteUpLink.addEventListener("click", e => {
            categoryChannel.push("up_vote", {id: postId})
        })

        voteDownLink.addEventListener("click", e => {
            categoryChannel.push("down_vote", {id: postId})
        })

        // Up vote event
        categoryChannel.on("up_vote", resp => {
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
        })

        // Down vote event
        categoryChannel.on("down_vote", resp => {
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
        })

        categoryChannel.join()
            .receive("ok", resp => {

                if (resp.point == null) {
                    voteSpan.textContent = "0"
                } else {
                    voteSpan.textContent = resp.point
                }

                if (resp.value == 1) {
                    $(voteUpLink).addClass("green").removeClass("inverted");
                    $(voteDownLink).addClass("red").addClass("inverted");
                } else if (resp.value == -1) {
                    $(voteDownLink).addClass("red").removeClass("inverted");
                    $(voteUpLink).addClass("green").addClass("inverted");
                }
            })
            .receive("error", resp => { console.log("failed to join", resp)})
    },
}

export default Category
