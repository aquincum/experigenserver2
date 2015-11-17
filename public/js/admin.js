(function($){    
    $(function(){

        function apiCall(request, callback){
            var req = "/" + request + "?";
            respond("");
            req += "sourceurl=" + $("input[name=sourceURL]").val();
            req += "&experimentName=" + $("input[name=experimentName]").val();
            $.get(req)
                .done(function(data){
                    if(data == "No such experiment!"){
                        respond(data);
                    }
                    else {
                        callback(data);
                    }
                })
                .fail(function(){
                    respond("API response error");
                });
        }

        function respond(s){
            $("#status").html(s);
        }
        $("input[name=checkExistence]").click(function(){
            apiCall("users", function(data){
                respond(data.split("\n").length - 2);
            });
        });
        $("input[name=getData]").click(function(){
            apiCall("makecsv", function(data){
                var blob = new Blob([data], {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob),
                    a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = "xp.csv";
                a.click();
                window.URL.revokeObjectURL(url);
            });
        });
    });
})(jQuery);
