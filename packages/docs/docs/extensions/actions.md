---
id: actions
title: Actions
sidebar_label: Actions
description: How to build Action components for Standard Notes.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - build an extension
  - actions
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

Actions are menu-based extensions that allow you to build simple APIs that do not require a user interface. Actions have the power to receive the working note and modify it. We use actions for our Note History extension, as well as Listed and File Attachments.

## Building an Action

Building an action-based extension can be done through any backend system of your choosing. We use Rails to build the [Listed](https://github.com/standardnotes/listed) extension, which allows you to create and manage a blogging publication from your notes.

In this example, we'll recreate a simple clone of Listed.

1. Generate a secret installation link for the user.

   The secret installation link will contain a randomly generated secret key that authenticates the user to the server. The user need only copy the resulting link into Standard Notes, and it is then remembered automatically and sent to the server with every subsequent request.

   ```ruby
   author = Author.new
   secret =  Digest::SHA256.hexdigest(SecureRandom.hex)
   secret_url = CGI.escape("#{ENV['HOST']}/authors/#{author.id}/extension/?secret=#{secret}&type=sn")
   ```

   Display the `secret_url` to the user and instruct them to install the url in Standard Notes, via the Extensions menu in the lower left corner.

1. Whenever the user clicks on the "Actions" menu within Standard Notes, SN will make a GET request to the user's secret URL. It is here that you return a JSON object that contains some metadata and applicable actions.

   Here is what Listed handles the `extension` endpoint that is encoded in the user's secret url:

   ```ruby
   def extension
     secret = params[:secret]
     item_uuid = params[:item_uuid]

     name = "Listed"
     supported_types = ["Note"]
     actions = []
     if item_uuid
       actions += [
         {
           :label => "Publish to Blog",
           :url => "#{ENV['HOST']}/authors/#{@author.id}/posts/?unlisted=false&secret=#{secret}&item_uuid=#{item_uuid}",
           :verb => "post",
           :context => "Item",
           :content_types => ["Note"],
           :access_type => "decrypted"
         },
         {
           :label => "Open Blog",
           :url => @author.username && @author.username.length > 0 ? @author.url : "#{ENV['HOST']}/authors/#{@author.id}",
           :verb => "show",
           :context => "Item",
           :content_types => ["Note"],
           :access_type => "decrypted"
         },
         {
           :label => "Publish to Private Link",
           :url => "#{ENV['HOST']}/authors/#{@author.id}/posts/?unlisted=true&secret=#{secret}&item_uuid=#{item_uuid}",
           :verb => "post",
           :context => "Item",
           :content_types => ["Note"],
           :access_type => "decrypted"
         }
       ]
     end

     post = Post.find_by_item_uuid(item_uuid)
     if post
       actions.push(
       {
         :label => "Open Private Link",
         :url => "#{ENV['HOST']}/#{post.token}",
         :verb => "show",
         :context => "Item",
         :content_types => ["Note"]
       })

       actions.push(
       {
         :label => "Unpublish",
         :url => "#{ENV['HOST']}/authors/#{@author.id}/posts/#{post.id}/unpublish?secret=#{secret}",
         :verb => "post",
         :context => "Item",
         :content_types => ["Note"]
       })
     end

     actions.push (
     {
       :label => "Settings",
       :url => "#{ENV['HOST']}/authors/#{@author.id}/settings?secret=#{secret}",
       :verb => "show",
       :context => "Item",
       :content_types => ["Note"]
     }
     )

     description = "Publishes to listed.to. Requires decrypted access to publishing note."
     render :json => {
       :name => name,
       :description => description,
       :supported_types => supported_types,
       :actions => actions,
       :content_type => "Extension",
       :identifier => "com.my.extension"
     }
   end
   ```

1. When a user selects the action, your server should be ready to handle that endpoint, and in most cases expect an item. Here's how Listed handles the "Publish to Blog" action:

   ```ruby
   def create
     item_uuid = params[:item_uuid]
     post = Post.find_by_item_uuid(item_uuid)
     if post && post.author != @author
       return
     end

     if !post
       post = @author.posts.new(post_params)
     else
       post.update(post_params)
     end

     item = params[:items][0]
     content = item["content"]

     post.title = content["title"]
     post.text = content["text"]
     post.save
   end
   ```

### Properties

Actions have the following properties:

| Key                 | Description                                                                                                                                                                                                                                                                                                                                                       |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`label`**         | What the UI will display for this action.                                                                                                                                                                                                                                                                                                                         |
| **`url`**           | The URL that Standard Notes will make a request to when the user selects this action.                                                                                                                                                                                                                                                                             |
| **`verb`**          | Instructs Standard Notes how to handle the URL. This can be one of:                                                                                                                                                                                                                                                                                               |
| **`show`**          | Standard Notes will open the `url` in a browser.                                                                                                                                                                                                                                                                                                                  |
| **`post`**          | Standard Notes will make a POST request to the `url` with the current item included in the parameters.                                                                                                                                                                                                                                                            |
| **`get`**           | Standard Notes will make a GET request to the `url` and expect an `Item` in response. The item will be used to update the current working note. We use this for our Note History extension to update the current note with a previous version of it.                                                                                                              |
| **`render`**        | Standard Notes will make a `GET` request to the `url` and expect an `Item`, but instead of updating the item, it will preview it in a modal. This allows a user to preview the contents of an incoming item before choosing to replace the current note with whatever is retrieved from the server. We also use this in our Note History extension.               |
| **`context`**       | Context should mostly be `Item`, which means that this action applies to a particular item, and is not just a general action. In the past, `context` could take on the value of `global`, which means it has actions available that are not related to an item. However, this functionality is unofficially deprecated, with an official deprecation coming soon. |
| **`content_types`** | The kinds of items this action applies to. Currently only 'Note' actions are supported. In the future, we might allow for actions on a `Tag` or other content types, but no such interface is currently available.                                                                                                                                                |

For example, the expected response of a **`get`** action is:

```json
{
  "item": {
    "uuid": "",
    "content_type": "",
    "content": "",
    "created_at": "",
    "updated_at": ""
  }
}
```

The payload inside the `item` key is the same payload structure you would see if you downloaded an encrypted backup file from the Account menu and inspected the `.txt` file. The item needs to be in the encrypted format when it appears. We'll need to modify the client code to also accept decrypted items.

## Installing an Action

Actions have the following URL format:

```
https://host.org/my-action?type=action&name=MyAction
```

## Action Potential

There are a lot of cool things you can build with actions. For example, you can build an action that receives the current note which consists of a bunch of numbers separated by a comma, and the action can compute the average, and return the new note contents which appends the average. This is a simple use case, but can be enlarged to build more powerful abilities.

You might even build an action that for example receives JavaScript code in the note text, runs the JavaScript, computes the result, and returns the result which is then appended to the note body in creative ways. The possibilities are almost endless.
