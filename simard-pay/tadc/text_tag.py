from .tag import Tag


class TextTag(Tag):
    def __init__(self, tag_name: str, text: str):
        self.text = text
        super().__init__(tag_name)

    def build_node(self, document):
        node = super().build_node(document=document)
        text_node = document.createTextNode(self.text)
        node.appendChild(text_node)
        return node
