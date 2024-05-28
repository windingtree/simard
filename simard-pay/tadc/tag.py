class Tag(object):
    def __init__(self, tag_name: str):
        self.tag_name = tag_name

    def build_node(self, document):
        node = document.createElement(self.tag_name)
        return node
