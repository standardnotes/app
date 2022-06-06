angular.module('app').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('directives/tag_cell.html',
    "<li>\n" +
    "<div class='self' draggable='true' drop='onDrop' ng-class='{&#39;selected&#39; : tag.selected}' ng-click='selectTag()' tag-id='tag.uuid'>\n" +
    "{{tag.displayTitle}}\n" +
    "</div>\n" +
    "</li>\n" +
    "<li ng-if='tag.children'>\n" +
    "<ul>\n" +
    "<div change-parent='changeParent()' class='tag-cell' ng-repeat='child in tag.children' on-select='onSelect()' tag='child'></div>\n" +
    "</ul>\n" +
    "</li>\n"
  );


  $templateCache.put('directives/tag_tree.html',
    "<div ng-if='tag'>\n" +
    "<div class='self' draggable='true' drop='onDrop' is-draggable='isDraggable()' is-droppable='isDroppable()' ng-class='{&#39;selected&#39; : tag.selected}' ng-click='selectTag($event)' tag-id='tag.uuid'>\n" +
    "<div class='tag-info' ng-class='&#39;level-&#39; + generationForTag(tag)'>\n" +
    "<div class='sk-circle small' ng-class='circleClassForTag(tag)' ng-click='innerCollapse(tag); $event.stopPropagation();'></div>\n" +
    "<div class='title' ng-if='!tag.dummy &amp;&amp; !tag.editing'>\n" +
    "{{tag.displayTitle}}\n" +
    "</div>\n" +
    "<input class='title' mb-autofocus='true' ng-if='!tag.dummy &amp;&amp; tag.editing' ng-keyup='$event.keyCode == 13 &amp;&amp; saveTagRename(tag)' ng-model='tag.displayTitle' should-focus='true'>\n" +
    "<div class='action-menu' ng-if='!tag.dummy &amp;&amp; tag.selected &amp;&amp; !tag.editing &amp;&amp; !tag.content.isSystemTag'>\n" +
    "<div class='sk-button info' ng-click='addChild($event, tag);'>\n" +
    "<div class='sk-label'>+</div>\n" +
    "</div>\n" +
    "<div class='sk-button danger' ng-click='removeTag(tag); $event.stopPropagation();' ng-if='!tag.master'>\n" +
    "<div class='sk-label'>–</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div class='new-tag-form' ng-if='tag.dummy'>\n" +
    "<input mb-autofocus='true' ng-blur='saveNewTag(tag)' ng-keyup='$event.keyCode == 13 &amp;&amp; saveNewTag(tag)' ng-model='tag.content.title' placeholder='' should-focus='true'>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div ng-if='!tag.clientData.collapsed' ng-repeat='child in tag.children'>\n" +
    "<div change-parent='changeParent()' class='tag-tree' create-tag='createTag()' delete-tag='deleteTag()' ng-if='!child.deleted' on-select='onSelect($event)' on-toggle-collapse='onToggleCollapse()' save-tags='saveTags()' tag='child'></div>\n" +
    "</div>\n" +
    "</div>\n"
  );


  $templateCache.put('home.html',
    "<div class='sn-component'>\n" +
    "<div class='content'>\n" +
    "<div class='tag-tree master' create-tag='createTag' delete-tag='deleteTag' ng-if='smartMasterTag.rawTags.length &gt; 0' on-select='selectTag' on-toggle-collapse='toggleCollapse' save-tags='saveTags' tag='smartMasterTag'></div>\n" +
    "<div change-parent='changeParent' class='tag-tree master' create-tag='createTag' delete-tag='deleteTag' on-select='selectTag' on-toggle-collapse='toggleCollapse' save-tags='saveTags' tag='masterTag'></div>\n" +
    "</div>\n" +
    "</div>\n"
  );

}]);
