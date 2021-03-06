$(document).ready(function(){
    $(document.body).on('mouseover','.a-support', function() {
        popMessage(this.parentElement, $(this).attr('data-total') + " Supports");
    });
    $(document.body).on('mouseover','.a-downvote', function() {
        popMessage(this.parentElement, $(this).attr('data-total') + " Downvotes");
    });


  $('.notifications').popover({ 
    html : true,
    content: function() {
      return $('#popover_notification_content').html();
    }
  });

});



function get_csrf(){
        var a = document.getElementsByTagName("input");
        for(x in a)
        {
            if(a[x].getAttribute("type")=="hidden")
            {
                return a[x].value;
                break;
            }
        }
    }

function vote(elem, id, vote_type, item) // elem is the container of text for support/downvote
    {
        var inc;
        $.post("/complain/vote/",
            {
                object_id:id,
                csrfmiddlewaretoken:get_csrf(),
                type:vote_type,
                vote_item:item
            }, function(data, stat) { 
                inc = data.increment;
                var votes = parseInt($("#vote_"+item+"_"+id).text());
                votes+=inc;
                $("#vote_"+item+"_"+id.toString()).text(votes.toString());

                var txt = elem.children[0].innerHTML;
                var parentelem = elem.parentElement;
                
                // elem is an A element, find next a
                var next_a;
                $(parentelem).find('a').each(function(i, e) {
                    if(e!=elem && e.innerHTML!="Report") {
                        next_a = e;
                        return;
                    }
                });
                var elem_val = parseInt($(elem).attr('data-total'));
                var next_a_val = parseInt($(next_a).attr('data-total'));

                var childs = parentelem.children;
                var next_elem;
                $(parentelem).find('.vote-status').each(function(i, e) {
                    if(txt!=e.innerHTML) {
                        next_elem = e;
                    }
                });

                var supported = false;
                if(data.action=='undo') {
                    if(txt=="Supported") {
                        elem.children[0].innerHTML="Support";
                    }
                    else {
                        elem.children[0].innerHTML="Downvote";
                    }
                    $(elem).attr('data-total', (elem_val-1).toString());
                    elem.children[0].className="vote-status";
                }
                else {
                    if(Math.abs(inc)==2){
                        $(elem).attr('data-total', (elem_val+1).toString());
                        $(next_a).attr('data-total', (next_a_val-1).toString());
                    }
                    else $(elem).attr('data-total', (elem_val+1).toString());

                    elem.children[0].className="text-bold vote-status";
                    if(txt=="Support") {
                        supported = true;
                        elem.children[0].innerHTML="Supported";
                        next_elem.innerHTML="Downvote";
                        next_elem.className="vote-status";
                    }
                    else {
                        supported = false;
                        elem.children[0].innerHTML="Downvoted";
                        next_elem.innerHTML="Support";
                        next_elem.className="vote-status";
                    }
                }
        if(supported) {
            $(elem).parent().parent().find('.fb-share').attr('data-supported', 'supported');
            showWarning('Would you care to share in facebook? Your share could get supports to this thread.', 
                'shareClick('+id.toString()+')', 0, "Ok", "No, just Support");
        }
        else {
            $(elem).parent().parent().find('.fb-share').attr('data-supported', undefined);
        }

            }
        );
    }

function shareClick(id) {
    $('#thread-'+id.toString()).find('.fb-share').click();
    removeWarning();
}

function toggleComments(id) {
        $.post("/complain/get-comments/", 
            {"csrfmiddlewaretoken":get_csrf(), "threadid":id},
            function(data){
                $("#thread-comments"+id.toString()).html('');
                var comments = data.comments;
                $.each(comments, function(index, comment) {
                    appendComment($("#thread-comments"+id.toString()), comment);
                });
        });
        
        $("#display-form"+id.toString()).toggle("fast", function(){});
}

function postComment(id, user) {
    var txtarea = $("#comment-box"+id.toString());
    $.post("/complain/comment/",
            {"csrfmiddlewaretoken":get_csrf(), 
            "thread_id":id,
            "comment":txtarea.val()
            },
            function(data) {
                txtarea.val('');
                var comment = data.comment;
                appendComment($("#thread-comments"+id.toString()), comment);
                var numcmts = $("#num-comments"+id.toString());
                var num = parseInt(numcmts.text());
                numcmts.text(num+1);
                $("#comment-text"+id.toString()).text(num==0?" Comment":" Comments");
            }
    );
}

function appendComment(elem, commentobj) {
    var temp = document.createElement("div");
    var cmmtdiv = document.createElement("div");
    cmmtdiv.className = "comment";
    var userspan = document.createElement("span");
    userspan.innerHTML = commentobj.user;
    userspan.className = "comment-user";
    var datespan = document.createElement("span");
    datespan.innerHTML = commentobj.date;
    datespan.className = "comment-date";
    var txtdiv = document.createElement("div");
    txtdiv.innerHTML = commentobj.comment;
    txtdiv.className = "comment-text";
    cmmtdiv.appendChild(userspan);
    cmmtdiv.appendChild(datespan);
    cmmtdiv.appendChild(txtdiv);
    temp.appendChild(cmmtdiv);
    elem.append(temp.innerHTML);
}

function images_html(images, threadid) {
    var html = '';
    for(var x=0;x<images.length;x++) {
                html+=
                '<a class="img-post" href="javascript:void(0)"><img src="/media/'+images[x]+'" height="50%" width="50%" data-toggle="modal" data-target="#myModalImage'+x.toString()+threadid.toString()+'" data-keyboard="true"></img></a>' +
                '<div class="modal fade" id="myModalImage'+x.toString()+threadid.toString()+'" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">'+
                  '<div class="modal-dialog modal-custom" role="document">'+
                    '<div class="modal-content">'+
                      '<div class="modal-post">'+
                        '<button type="button" class="close my-close close-image" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
                      '</div>'+
                      '<div class="row">'+
                        '<div class="col-md-7">'+
                          '<img class="post-image" src="/media/'+images[x]+'"></img>'+
                        '</div>'+
                        
                        '</div>'+
                      '</div>'+
                    '</div>'+
                  '</div>';
    }
    return html;
}

function removeWarning() {
    $('#warning-box').empty();
    $('#warning-box').hide();
    $('#mask').css({"z-index":1});
    $('#mask').hide();
}

// need to verify if thread deleted or not and show corresponding message, not imp though
function deleteThread(threadid) {
    $.get('/complain/thread/delete/'+threadid+'/', function(data) {
        if(data.success) {
            var loc = window.location;
            window.localStorage.setItem("message", data.message);
            window.location = loc;
        }
        else {
            removeWarning();
            $('#error').text(data.message);
        }
    });
}

function showWarning(message, onclickfunc, threadid, ok, cancel) {
    $('#mask').css({
        "width":$(document).width(),
        "height":$(document).height(),
        "z-index":3,
        "background-color":'#000',
        "opacity":0.5
    }).show();
    var x = $(window).width(), 
        y = $(window).height();
    var w = 400
        h = 200; 
    var left = Math.round(x/2-w/2);
    // create the dialog box
    var html =  '<div class="modal-delete">'+
                '<div class="modal-header my-color modal-edit">'+
                '<button onclick="removeWarning()" type="button" class="close my-close" data-dismiss="modal" data-keyboard="true" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
                '<h4 class="modal-title my-modal-title" id="myModalLabel">Info</h4><br>'+
            '</div>'+
            '<div class="warning-text">'+
                message +
            '</div>'+
            '<div class="modal-footer">'+
                (threadid!=undefined?'<button class="btn btn-my" type="button" onclick="'+onclickfunc+'">'+ok+'</button>':'')+
                '<button class="btn btn-default" type="button" onclick="removeWarning()">'+(threadid!=undefined?cancel:'Ok')+'</button>'+
            '</div>'+
            '</div>';
    var box = $('<div>').attr('class','warning-box')
                .html(html);
    $('#warning-box').append(box);

    var tp = window.scrollY + Math.round(y/2-h/2);
    var styles = {"top":tp,
                "left":left,
                "z-index":5,
                "height":h,
                "width":w};

    $('#warning-box').css(styles).show();
    //$('body').append($('<div style="position:relative;top:300px;background-color:blue;height:300px;"></div>'));
}

function editPost(threadid) {
    $('#mask').css({
        "width":$(document).width(),
        "height":$(document).height(),
        "z-index":3,
        "background-color":'#000',
        "opacity":0.5
    }).show();
    var x = $(window).width(), 
        y = $(window).height();
    var w = 500
        h = 500; 
    var left = Math.round(x/2-w/2);
    // create the dialog box
    var html = '<div class="modal-delete">'+
            '<div class="modal-header my-color modal-edit">'+
                '<button onclick="removeWarning()" type="button" class="close my-close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
                '<h4 class="modal-title my-modal-title" id="myModalLabel">Edit Your View</h4><br>'+
            '</div>'+
            '<b>Title</b><br>'+
            '<textarea>Yo title ho</textarea><br>'+
            '<b>Content</b><br>'+
            '<textarea>Yo content ho</textarea>'+
            
            '<div class="form">'+
                '<label for="recipient-name" class="control-label">Tags * <small id="tags-warning" class="alert-danger" style="display:none">Please provide at least 1 tag(max 4) </small></label><br>'+
                '<input type="text" class="form-control" placeholder="Type in tag names (max 4)" id="tagbox"/>'+
                '<ul class="nav" id="tags-suggest-list" style="z-index:100;position:absolute;">'+
                '</ul>'+
                '<div id="tags-chosen">'+
                '</div>'+
            '</div><br><br>'+
            
            '<div class="modal-footer">'+
                '<button class="btn btn-my" type="button" onclick="updateThread('+threadid+')">Ok</button>'+
                '<button class="btn btn-default" type="button" onclick="removeWarning()">Cancel</button>'+
            '</div>'+
            '</div>';
    var box = $('<div>').attr('class','warning-box')
                .html(html);
    $('#warning-box').append(box);

    var tp = window.scrollY + Math.round(y/2-h/2);
    var styles = {"top":tp,
                "left":left,
                "z-index":5,
                "height":h,
                "width":w};

    $('#warning-box').css(styles).show();
}

function generate_thread(threadobj, auth) {
    var up = threadobj.supported;
    var down = threadobj.thumbed_down;
    var thread_str = '<div class="box thread" id="thread-'+threadobj.id+'">'+
        '<div class="stbody">'+
            '<div id="recent" class="tab-pane fade in active">'+
                '<div class="stimg">'+
                    '<img class="img-circle" src="/media/'+threadobj.user.image+'" width=50 height=50/>'+
                '</div>'+
                '<div class="post-option">'+
                    (threadobj.can_edit?
                    //'<a href="javascript:void()" onclick="editPost('+threadobj.id+')">'+
                    //'<span class="glyphicon glyphicon-edit"></span>'+
                    //'</a>'+
                    '<a href="javascript:void(0)" onclick="showWarning(\'Are you sure you want to delete the thread? This can not be undone.\', \'deleteThread('+threadobj.id.toString()+')\','+threadobj.id+', \'Ok\', \'Cancel\')">'+
                        '<span class="glyphicon glyphicon-remove glyphicon-remove-post"></span>':''+
                        '</a>'
                    ) +
              '</div><div id="textst" class="sttext">'+
                '<a href="/thread/'+threadobj.id.toString()+'">'+
                '<div class="post-title">'+
                    (threadobj.title||threadobj.content)+
                '</div>'+
                '</a>'+
                '<div class="post-body">'+
                    (threadobj.user.id==0?'<a href="#">':'<a href="/profile/'+threadobj.user.id+'">')+
                    '<span class="heading-property heading-post">'+threadobj.user.name+'</a>'+
                        '<div class="progress-area">'+
                            '<div class="progress" onmouseover="popMessage(this, \'Requires '+(threadobj.total_votes-threadobj.votes)+' supports\')">'+
                                '<div class="progress-bar my-progress-bar" role="progressbar" aria-valuenow="'+threadobj.votes.toString()+'" aria-valuemin="0" aria-valuemax="'+threadobj.total_votes.toString()+'" style="width:'+Math.round(threadobj.votes*100/threadobj.total_votes)+'%">'+
                                '</div>'+
                            '</div>'+
                            '<div class="post-reach">'+
                                (threadobj.total_votes-threadobj.votes)+
                            ' needed to reach 500 supports</div>'+
                        '</div>'+
                    '</span>'+
                    '<span class="sttime"> &nbsp; '+threadobj.time+
                    '</span>'+ 
                '</div>'+
                '<div class="post-about">'+
                    '</div>'+
                '<div class="post-content">'+
                    threadobj.content+
                '</div>'+
                '<div class="post-thread-image">'+
                    images_html(threadobj.images, threadobj.id)+
                '</div>'+
                '<div class="sttime">'+
                '</div>'+
                '<div class="row">'+
                    
                  '<div class="display-tag">'+
                    '<span id="tag-post2" class="glyphicon glyphicon-tags"></span>';
                for(var x in threadobj.tags) {
                    thread_str+= '<a class="tagname tagname2" href="/threads/tagged/'+threadobj.tags[x].name+'/">'+ threadobj.tags[x].name+'</a>';
                }
                thread_str+='</div>'+
                '</div>'+
                '</div>'+
            '</div>'+
          '</div>'+
          '<div class="display-target">'+
                '<span class="target-text">To </span><span>'+threadobj.target+'</span>'+
          '</div>'+
          '<div class="row background-icons">'+
          '<div class="box-icons">'+
            '<div class="icons-ld">'+
                    '<a data-total="'+threadobj.supports+'" class="a-support" id="action-element" href="javascript:void(0)" onclick="'+ (auth==true?'vote(this, '+threadobj.id+', \'upvote\', \'thread\')':'popMessage(this, \'You must be logged in!! \')')+'">'+
                      '<span class="vote-status '+(up?'text-bold':'')+'" aria-hidden="true">Support'+(up?'ed':'')+'</span>'+
                    '</a>'+
                    '<span class="net-vote" data-toggle="tooltip" data-placement="right" id="vote_thread_'+threadobj.id+'">'+threadobj.votes+'</span>'+
                    '<a class="a-downvote" data-total="'+threadobj.downvotes+'" id="action-element" href="javascript:void(0)" onclick="'+ (auth==true?'vote(this, '+threadobj.id+', \'downvote\', \'thread\')':'popMessage(this, \'You must be logged in!! \')')+'">'+
                      '<span class="vote-status '+(down?'text-bold':'')+'" aria-hidden="true">Downvote'+(down?'d':'')+'</span>'+
                    '</a>'+
                    '<a href="#" class="report-post">Report</a>'+
              '</div>'+
              '<div class="post-action">'+
                '<div class="comment-section">'+
                '<a href="javascript:void(0)" onclick="toggleComments('+threadobj.id+')">&nbsp;<span class="glyphicon glyphicon-comment" aria-hidden="true"></span>'+
                  '<span class="comment-textsize" id="num-comments'+threadobj.id+'">'+threadobj.num_comments+'</span><span class="comment-textsize" id="comment-text'+threadobj.id+'"> Comment'+(threadobj.num_comments!=1?'s':'')+'</span>'+
                '</a>'+
              '</div>'+
              '<div class="share">'+
                '<button'+(up?' data-supported="supported"':'')+' data-content="'+threadobj.content.substr(0,100)+
                ' ..." data-id="'+threadobj.id.toString()+'" data-title="'+threadobj.title+'" data-image="'+
                (threadobj.images.length>0?threadobj.images[0]:"")+'" data-requiredvotes="'+
                (threadobj.total_votes-threadobj.votes)+'" data-totalvotes="'+threadobj.total_votes+
               '" class="fb-share facebook shadow" aaaonclick="return fbs_click(\'/thread/'+threadobj.id.toString()+
                '/\', \''+threadobj.title+'\')" target="_blank"></button>'+
                '<button class="twitter shadow" onclick="return twt_click(\'/thread/'+threadobj.id.toString()+'/\', \''+threadobj.title+'\')"></button>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="comment-form" id="display-form'+threadobj.id+'">'+
            '<div class="display-comments" id="thread-comments'+threadobj.id+'"></div>'+
            (auth==true?
            '<textarea class="form-comment" id="comment-box'+threadobj.id+'" placeholder="Your comment here."></textarea>'+
            '<button class="btn btn-comment" onclick="postComment('+threadobj.id+', \''+threadobj.user.name+'\')">Comment</button>':'')
            +
          '</div>'+
          '</div>'+
        '</div>';
    return thread_str;
}

function add_item(threadobj, divParentId, authenticated) {
	// check if profile page or not
	var tmp = window.location.pathname;
	tmp = tmp.split('/');
    if(threadobj.anonymous && !threadobj.can_edit && tmp.indexOf('profile')>0)
        return;
    var elem = document.getElementById(divParentId);
    elem.innerHTML+=generate_thread(threadobj, authenticated);
}

function popMessage(elem, msg) {
    var child = elem.childNodes[0];
    var newdiv = document.createElement('div');
    newdiv.innerHTML = msg;
    newdiv.setAttribute("class", "popup-message");
    /*
    newdiv.style.position="absolute";
    newdiv.style.color="#e33";
    newdiv.style.padding="1px";
    newdiv.style.fontSize="0.9em";
    newdiv.style.width="175px";
    newdiv.style.zIndex="100";
    newdiv.style.backgroundColor="#333";
    newdiv.style.border="solid 2px #555";
    newdiv.style.borderRadius="3px";
    */
    child.appendChild(newdiv);
    setTimeout(function() { $(newdiv).delay(100).fadeOut(); newdiv.parentNode.removeChild(newdiv); }, 1000);
    //$(newdiv).hide().delay(1000).fadeOut();
}

function search() {
    var url = '/threads/search/?query=';
    url+=$('#searchquery').val();
    location.href = url;
    return false;
}

function mark_read() {
    $.get('/mark-read/', {}, function(data) {
        if(data.success) {
            $('.notification-count').hide();
        }
    });
}

// TWITTER AND FACEBOOK SHARE
function fbs_click(u, t) {
      u = 'www.udghos.com'+u;
     window.open('http://www.facebook.com/sharer.php?u='+encodeURIComponent(u)+'&p[title]='+encodeURIComponent(t),'facebook-sharer','toolbar=0,status=0,width=626,height=436');
      return false;
}

  function twt_click(u, t) {
      u = 'http://www.udghos.com'+u;
      window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(t)+'&url='+encodeURIComponent(u)+'&via=udghosnepal', 'sharer', 'toolbar=0,status=0,width=626,height=346');
      return false;
    }


