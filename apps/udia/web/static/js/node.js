let Node = {
  init(socket, element) {
    if (!element) {
      return
    }
    let nodeId = element.getAttribute("data-id")
    socket.connect()
    this.onReady(nodeId, socket)
    console.log("Node channel init")
  },

  onReady(nodeId, socket) {
    let msgContainer = document.getElementById("msg-container")
    let msgInput = document.getElementById("msg-input")
    let postButton = document.getElementById("msg-submit")
    let nodeChannel = socket.channel("nodes:" + nodeId)

    postButton.addEventListener("click", e => {
        let payload = {body: msgInput.value}
        nodeChannel.push("new_comment", payload)
            .receive("error", e => console.log(e))
        msgInput.value = ""
    })

    nodeChannel.on("new_comment", (resp) => {
        nodeChannel.params.last_seen_id = resp.id
        this.renderComment(msgContainer, resp)
    })

    nodeChannel.join()
        .receive("ok", resp => {
            let ids = resp.comments.map(comment => comment.id)
            if (ids.length > 0) {
                nodeChannel.params.last_seen_id = Math.max(...ids)
            }
            resp.comments.filter(comment => {
              this.renderComment(msgContainer, comment)
            })
            console.log("joined the node channel", resp)
        })
        .receive("error", reason => console.log("join failed", reason))
  },
  esc(str) {
      let div = document.createElement("div")
      div.appendChild(document.createTextNode(str))
      return div.innerHTML
  },

  renderComment(msgContainer, {
      user,
      body
  }) {
      let template = document.createElement("div")
      template.innerHTML = `
      <a href="#">
        <b>${this.esc(user.username)}</b>: ${this.esc(body)}
      </a>
      `

      msgContainer.appendChild(template)
      msgContainer.scrollTop = msgContainer.scrollHeight
  }
}

export default Node