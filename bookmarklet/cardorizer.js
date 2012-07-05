require([cardorizer_url + '/bookmarklet/lib/jquery.min.js'], send_to_trello);

//board_id and cardorizer_url are defined directly in the bookmarklet

function send_to_trello() {
    var card_details = null;
    for (var i in sources) {
        var source = sources[i];
        if (source.identify()) {
            card_details = source.parse();
            break;
        }
    }

    if (card_details == null) {
        return;
    }

    var parameters = {
        boardid: board_id,
        name: card_details['name'],
        description: card_details['description']
    };

    var $iframe = $("<iframe>")
        .attr("src", cardorizer_url + "?" + $.param(parameters))
        .hide()
        .appendTo("body")
        .load(function(){
            $("<div>").text("Added Card to Trello")
            .css({position: 'absolute',
                  left: 0,
                  top: 0,
                  'z-index': 99999999,
                  color: '#e3e3e3',
                  'background-color': '#287CAB',
                  padding: '5px',
                  'font-size': '13px',
                  'font-weight': 'bold',
                  'line-height': '30px',
                  'text-shadow': '0 1px rgba(0, 0, 0, 0.4)'})
            .appendTo("body")
            .fadeOut(2000, function() { $iframe.remove() } );
        });
}

/* sources:
 *   identify: returns true/false if the current page is one of the
 *             pages that this source will be able to parse
 *      parse: returns an object with the following contents
 *              - name: the name/title of the card
 *              - description: the description of the card
 */

var sources = [
    //JIRA
    {
        identify: function() {
            return ($("#key-val").length > 0);
        },

        parse: function() {
            var key = $("#key-val").text();
            var summary = $("#issue_header_summary").children().first().text();
            return { name: key + ": " + summary, description: location.href };
        }
    },

    //github issues
    {
        identify: function() {
            return ($("#show_issue").length > 0);
        },

        parse: function() {
            var card_name = $("#show_issue .number strong").text() + " " +
                $("#show_issue .content-title").text();
            return { name: card_name, description: location.href };
        }
    },

    //fogbugz
    {
        identify: function() {
            return (!!window.goBug);
        },

        parse: function() {
            var bug = window.goBug;
            var card_name = bug.ixBug + ": " + bug.sTitle;
            return { name: card_name, description: location.href };
        }
    },

    //trello card
    {
        identify: function() {
            //make sure the details of a card are being shown
            return (location.pathname.substring(0, 6) == "/card/");
        },

        parse: function() {
            var card_name = $('.card-detail-title .window-title-text').text();
            return { name: card_name, description: location.href };
        }
    },

    //trac
    {
        identify: function() {
            return ($("#trac-ticket-title").length > 0);
        },

        parse: function() {
            var card_name = $("title").text();
            return { name: card_name, description: location.href };
        }
    },

    // MLS
    {
      identify: function(){
        return ($("a[href*='mlsli.com'] img[alt*='return to our homepage']").length > 0 );
      },

      parse: function() {
							 var make_link = function(args) {
								     var str = "";
								     var type = args.type;
								     var opts = args.opts;
								     switch (type) {
									     case "image":
										         str = "![img](" + opts[0] + ")";
									         break;
									     case "link":
										         str = "[" + opts[0] + "](" + opts[1] + ")";
									         break;
									     }
								     return str;
							 };

							 var make_links = function(links) {
								     var desc = "";
								     $.each(links, function(type, opts) {
										         desc = desc + make_link(opts) + "\n\n";
										     });
								     return desc;
							 };


							 /**
								* Get values for card
								*/
							 // Use address for the name of the card
							 var address = $('.detail-bold:first').text();
							 address = address.replace(/\n/gi,',').replace(/\s+/gi,' ').replace(/^[\s,]+/gi,'');

							 // Image URL
							 var image = $('img#big').attr('src');
							 // Listing URL
							 var url = location.href;

							 var encoded = encodeURI(address);
							 var map_link = "https://maps.google.com/?q=" + encoded;
							 var map_image = "http://maps.googleapis.com/maps/api/staticmap?zoom=13&size=480x360&sensor=false&markers=" + encoded;

							 // Other things to add
							 var values = {
								     MLS: make_link({
type: "link",
        opts: ["Link", url]
    }),
								     Map: make_link({
										         type: "link",
										         opts: ["Link", map_link]
										     }),
								 Price: $('tr.bodytext-nopadding td:last span').text().replace(/[\s\n]+/gi,' ').split('$')[1]
							 };

							 /**
								*
								* Format card
								*
								*/
							 var desc = "";

							 $.each(values, function(key, value) {
									     desc = desc + "* **" + key + "**: " + value + "\n";
									 });
							 desc = desc + "\n---\n";

							 desc = desc + make_links({
									     mls_image: {
									         type: "image",
									         opts: [image]
									     },
									     map_image: {
									         type: "image",
									         opts: [map_image]
									     }
									 });

							 return { name: address, description: desc };
						 }
		}
];
