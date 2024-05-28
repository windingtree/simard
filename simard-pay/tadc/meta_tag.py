from .tag import Tag
from typing import List

class MetaTag(Tag):
    def __init__(self, tag_name: str, tags: List[Tag]):
        self.tags = tags
        super().__init__(tag_name)

    def build_node(self, document):
        node = super().build_node(document=document)
        for tag in self.tags:
            node.appendChild(tag.build_node(document))

        return node
