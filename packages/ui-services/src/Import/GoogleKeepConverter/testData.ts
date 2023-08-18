const jsonWithTextContent = {
  color: 'DEFAULT',
  isTrashed: false,
  isPinned: false,
  isArchived: false,
  textContent: 'This is a test.',
  title: 'Testing 1',
  userEditedTimestampUsec: 1618528050144000,
}

export const jsonTextContentData = JSON.stringify(jsonWithTextContent)

const jsonWithListContent = {
  color: 'DEFAULT',
  isTrashed: false,
  isPinned: false,
  isArchived: false,
  listContent: [
    {
      text: 'Test 1',
      isChecked: false,
    },
    {
      text: 'Test 2',
      isChecked: true,
    },
  ],
  title: 'Testing 1',
  userEditedTimestampUsec: 1618528050144000,
}

export const jsonListContentData = JSON.stringify(jsonWithListContent)

export const htmlTestData = `<?xml version="1.0" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Testing 2</title>
<style type="text/css">
         body {
  font-family: 'Roboto Condensed','Droid Sans',arial,sans-serif;
  font-size: 15px;
  color: rgba(0,0,0,0.8);
  word-wrap: break-word;
  background-color: #e8e8e8;
}

hr {
    display: block;
    margin-top: 10px;
    margin-bottom: 10px;
    margin-left: 5px;
    margin-right: 5px;
    border-style: inset dashed;
    border-width: 1px;
}

.note {
  outline: none;
  box-shadow: 0 2px 1px rgba(0,0,0,0.08);
  box-sizing: border-box;

  max-width: 600px;
  min-width: 240px;
  margin: 20px;

  background-color: rgb(255, 255, 255);
}

.note .heading {
  font-size: 12px;
  padding: 15px 15px 0 15px;
  color: rgba(100,100,100,0.8);
}

.note .title {
  font-size: 17px;
  font-weight: bold;
  padding: 15px 15px 0 15px;
  min-height: 28px;
}

.note .content {
  padding: 12px 15px 15px 15px;
  font-family: 'Roboto Slab','Times New Roman',serif;
  font-size: 14px;
}

.note .attachments {
  padding: 0 15px 15px 15px;
}

.attachments ul {
  padding: 0;
  margin: 0;
}

.attachments li {
  list-style-type: none;
  margin-top: 12px;
}

.attachments li img {
  max-width: 100%;
}

.attachments .audio {
  background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KPCFET0NUWVBFIHN2ZyAgUFVCTElDICctLy9XM0MvL0RURCBTVkcgMS4xLy9FTicgICdodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQnPgo8c3ZnIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHZpZXdCb3g9IjAgMCAyMCAyMCIgdmVyc2lvbj0iMS4xIiB5PSIwcHgiIHg9IjBweCIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDIwIDIwIj4KPHBhdGggZD0ibTEgN3Y2aDRsNSA1di0xNmwtNSA1aC00em0xMy41IDNjMC0xLjgtMS0zLjMtMi41LTR2OGMxLjUtMC43IDIuNS0yLjIgMi41LTR6bS0yLjUtOC44djIuMWMyLjkgMC45IDUgMy41IDUgNi43cy0yLjEgNS44LTUgNi43djIuMWM0LTAuOSA3LTQuNSA3LTguOHMtMy03LjktNy04Ljh6Ii8+Cjwvc3ZnPgo=);
  background-size: 18px 18px;
  background-repeat: no-repeat;
  background-position: center;
  width: 22px;
  height: 22px;
  display: block;
}

.note .list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.note .listitem {
}

.note .listitem .bullet {
  position: absolute;
}

.note .listitem .text {
  margin-left: 20px;
}

.note .identifier {
  color: rgba(0, 0, 0, 0.5);
}
.note .identifier:before {
  content: "(";
}
.note .identifier:after {
  content: ")";
}

/* Only show identifiers when the element is hovered. */
.note .listitem .identifier,
.note .chip .identifier {
  display: none;
}

.note .listitem:hover .identifier,
.note .chip:hover .identifier {
  display: inline;
}

.note .chips {
  padding: 12px 15px 15px 15px;
}

.note .chip {
  display: inline-block;
  max-width: 198px;
  margin: 2px 4px 2px 0;
  padding: 2px 5px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  color: rgba(0, 0, 0, 0.7);
  font-size: 11px;
  font-family: 'Roboto','Droid Sans',arial,sans-serif;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.note .chip a {
  text-decoration: none;
  color: inherit;
}

.chip-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-size: 100%;
  margin-right: 5px;
  vertical-align: middle;
}

.annotation.CALENDAR .chip-icon {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCI+CiAgICA8cGF0aCBkPSJNMTcgMTJoLTV2NWg1di01ek0xNiAxdjJIOFYxSDZ2Mkg1Yy0xLjExIDAtMS45OS45LTEuOTkgMkwzIDE5YzAgMS4xLjg5IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJoLTFWMWgtMnptMyAxOEg1VjhoMTR2MTF6Ii8+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=);
}

.annotation.DOCS .chip-icon {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTkgM0g1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bS0xLjk5IDZIN1Y3aDEwLjAxdjJ6bTAgNEg3di0yaDEwLjAxdjJ6bS0zIDRIN3YtMmg3LjAxdjJ6Ii8+Cjwvc3ZnPgo=);
}

.annotation.GMAIL .chip-icon {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCI+CiAgICA8cGF0aCBmaWxsPSJub25lIiBkPSJNLTYxOC0yMTA0SDc4MnYzNjAwSC02MTh6TTAgMGgyNHYyNEgweiIvPgogICAgPHBhdGggZD0iTTIwIDRINGMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY2YzAtMS4xLS45LTItMi0yem0wIDE0aC0yVjkuMkwxMiAxMyA2IDkuMlYxOEg0VjZoMS4ybDYuOCA0LjJMMTguOCA2SDIwdjEyeiIvPgo8L3N2Zz4K);
}

.annotation.SHEETS .chip-icon {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTkgM0g1Yy0xLjEgMC0xLjk5LjktMS45OSAyTDMgOHYxMWMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgOGgtOHY4SDl2LThINVY5aDRWNWgydjRoOHYyeiIvPgo8L3N2Zz4K);
}

.annotation.SLIDES .chip-icon {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iIzAwMDAwMCI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTkgM0g1Yy0xLjEgMC0xLjk5LjktMS45OSAydjE0YzAgMS4xLjg5IDIgMS45OSAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgMTNINVY4aDE0djh6Ii8+Cjwvc3ZnPgo=);
}

.annotation.WEBLINK .chip-icon {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCI+CiAgICA8cGF0aCBkPSJNMTkgNEg1Yy0xLjExIDAtMiAuOS0yIDJ2MTJjMCAxLjEuODkgMiAyIDJoMTRjMS4xIDAgMi0uOSAyLTJWNmMwLTEuMS0uODktMi0yLTJ6bTAgMTRINVY4aDE0djEweiIvPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIvPgo8L3N2Zz4K);
}

.sharees h2 {
  display: none;
}

.sharees ul {
  list-style: none;
  margin: 0;
  padding: 0 15px 15px 15px;
}

.sharees li {
  display: inline-block;
  width: 22px;
  height: 22px;
  text-indent: 100%;
  white-space: nowrap;
  overflow: hidden;
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCI+CiAgICA8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAzYzEuNjYgMCAzIDEuMzQgMyAzcy0xLjM0IDMtMyAzLTMtMS4zNC0zLTMgMS4zNC0zIDMtM3ptMCAxNC4yYy0yLjUgMC00LjcxLTEuMjgtNi0zLjIyLjAzLTEuOTkgNC0zLjA4IDYtMy4wOCAxLjk5IDAgNS45NyAxLjA5IDYgMy4wOC0xLjI5IDEuOTQtMy41IDMuMjItNiAzLjIyeiIvPgogICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K);
  background-size: 18px 18px;
  background-repeat: no-repeat;
  background-position: center;
}

.sharees li.group {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTYgMTFjMS42NiAwIDIuOTktMS4zNCAyLjk5LTNTMTcuNjYgNSAxNiA1Yy0xLjY2IDAtMyAxLjM0LTMgM3MxLjM0IDMgMyAzem0tOCAwYzEuNjYgMCAyLjk5LTEuMzQgMi45OS0zUzkuNjYgNSA4IDVDNi4zNCA1IDUgNi4zNCA1IDhzMS4zNCAzIDMgM3ptMCAyYy0yLjMzIDAtNyAxLjE3LTcgMy41VjE5aDE0di0yLjVjMC0yLjMzLTQuNjctMy41LTctMy41em04IDBjLS4yOSAwLS42Mi4wMi0uOTcuMDUgMS4xNi44NCAxLjk3IDEuOTcgMS45NyAzLjQ1VjE5aDZ2LTIuNWMwLTIuMzMtNC42Ny0zLjUtNy0zLjV6Ii8+Cjwvc3ZnPgo=);
}

.note .meta-icons {
  float: right;
}

.note .meta-icons span {
  display: inline-block;
  background-size: 18px 18px;
  background-repeat: no-repeat;
  background-position: center;
  width: 22px;
  height: 22px;
  padding-left: 4px;
}

.meta-icons .pinned {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMHB4IiBoZWlnaHQ9IjIwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzQyODVmNCI+DQogICAgPHBhdGggZD0iTTE2IDVoLjk5TDE3IDNIN3YyaDF2N2wtMiAydjJoNXY2bDEgMSAxLTF2LTZoNXYtMmwtMi0yVjV6Ii8+DQogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIvPg0KPC9zdmc+);
}

.meta-icons .archived {
  background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KPCFET0NUWVBFIHN2ZyAgUFVCTElDICctLy9XM0MvL0RURCBTVkcgMS4xLy9FTicgICdodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQnPgo8c3ZnIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHZpZXdCb3g9IjAgMCAxOCAxOCIgdmVyc2lvbj0iMS4xIiB5PSIwcHgiIHg9IjBweCIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE4IDE4Ij4KPHBhdGggZD0ibTE2LjYgM2wtMS4yLTEuNWMtMC4yLTAuMy0wLjYtMC41LTEtMC41aC0xMC43Yy0wLjQgMC0wLjggMC4yLTEgMC41bC0xLjMgMS41Yy0wLjIgMC4zLTAuNCAwLjctMC40IDEuMXYxMS4xYzAgMSAwLjggMS44IDEuOCAxLjhoMTIuNGMxIDAgMS44LTAuOCAxLjgtMS44di0xMS4xYzAtMC40LTAuMi0wLjgtMC40LTEuMXptLTcuNiAxMC45bC00LjktNC45aDMuMXYtMS44aDMuNnYxLjhoMy4xbC00LjkgNC45em0tNi4xLTExLjFsMC43LTAuOWgxMC43bDAuOCAwLjloLTEyLjJ6Ii8+Cjwvc3ZnPgo=);
}

.meta-icons .trashed {
  background-image: url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE4cHgiIHdpZHRoPSIxOHB4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0iIzAwMDAwMCI+DQogPHBhdGggZD0ibTEyIDM4YzAgMi4yMSAxLjc5IDQgNCA0aDE2YzIuMjEgMCA0LTEuNzkgNC00di0yNGgtMjR2MjR6bTI2LTMwaC03bC0yLTJoLTEwbC0yIDJoLTd2NGgyOHYtNHoiLz4NCiA8cGF0aCBkPSJtMCAwaDQ4djQ4aC00OHoiIGZpbGw9Im5vbmUiLz4NCjwvc3ZnPg==);
}

.checked {
  text-decoration: line-through;
}

.RED {
  background-color: rgb(255, 109, 63) !important;
}
.ORANGE {
  background-color: rgb(255, 155, 0) !important;
}
.YELLOW {
  background-color: rgb(255, 218, 0) !important;
}
.GREEN {
  background-color: rgb(149, 214, 65) !important;
}
.TEAL {
  background-color: rgb(28, 232, 181) !important;
}
.BLUE {
  background-color: rgb(63, 195, 255) !important;
}
.GRAY {
  background-color: rgb(184, 196, 201) !important;
}

/* go/keep-more-colors-eng */
.CERULEAN {
  background-color: rgb(130, 177, 255) !important;
}
.PURPLE {
  background-color: rgb(179, 136, 255) !important;
}
.PINK {
  background-color: rgb(248, 187, 208) !important;
}
.BROWN {
  background-color: rgb(215, 204, 200) !important;
}

      </style></head>
<body><div class="note"><div class="heading"><div class="meta-icons">

</div>
Apr 15, 2021, 7:07:43 PM</div>
<div class="title">Testing 2</div>
<div class="content">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>


</div></body></html>`
