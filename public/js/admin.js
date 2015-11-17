(function($){
    $(function(){
        function respond(s){
            $("#status").html(s);
        }
        $("input[name=checkExistence]").click(function(){
            var req = "/users?";
            respond("");
            req += "sourceurl=" + $("input[name=sourceURL]").val();
            req += "&experimentName=" + $("input[name=experimentName]").val();
            $.get(req)
                .done(function(data){
                    if(data == "No such experiment!"){
                        respond(data);
                    }
                    else {
                        respond(data.split("\n").length - 2);
                    }
                })
                .fail(function(){
                    respond("API response error");
                });
        });
    });
})(jQuery);
