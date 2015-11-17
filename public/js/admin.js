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
                        respond(data, "danger");
                    }
                    else {
                        callback(data);
                    }
                })
                .fail(function(){
                    respond("API response error", "danger");
                });
        }

        function respond(s, alertstatus){
            $("#status").html(s);
            $("#status").removeClass("alert-info alert-danger alert-warning alert-success");
            if(alertstatus){
                $("#status").addClass("alert-" + alertstatus);
            }
        }
        $("input[name=checkExistence]").click(function(){
            apiCall("users", function(data){
                respond("<strong>Experiment exists.</strong> There are " + (data.split("\n").length - 2) + " users in the database.", "success");
            });
        });
        $("input[name=getData]").click(function(){
            apiCall("makecsv", function(data){
                respond("<strong>Success!</strong> Data download should start right away.", "success");
                var blob = new Blob([data], {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob),
                    a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = "xp.csv";
                a.target = "_blank";
                a.click();
                window.URL.revokeObjectURL(url);
            });
        });
    });
})(jQuery);
