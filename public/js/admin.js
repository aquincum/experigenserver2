function getDestination(){
    var desttxt = $("input[name=destination]").val();
    var destsel = $("select#destinationdropdown").val();
    if (desttxt !== ""){
        return desttxt;
    }
    if (destsel !== null){
        return destsel;
    }
    return "";
}

function apiCall(request, callback){
    var req = "/" + request + "?",
        dest = getDestination();
    respond("");
    req += "sourceurl=" + $("input[name=sourceURL]").val();
    req += "&experimentName=" + $("input[name=experimentName]").val();
    if(dest !== ""){
        req += "&file=" + dest;
    }

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


(function($){    
    $(function(){

        $("input[name=getData]").click(function(){
            apiCall("makecsv", function(data){
                respond("<strong>Success!</strong> Data download should start right away.", "success");
                var blob = new Blob([data], {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob),
                    a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = getDestination() || "xp.csv";
                a.target = "_blank";
                a.click();
                window.URL.revokeObjectURL(url);
            });
        });
        $("input[name=findDestinations]").click(function(){
            apiCall("destinations", function(data){
                respond("Destination dropdown box populated", "success");
                var dests = JSON.parse(data);
                var $dropdown = $("#destinationdropdown");
                $dropdown.show();
                var inner = '';
                $("input[name=destination]").hide();
                $("input[name=destination]").val("");
                $dropdown.addClass("dropdown");
                dests.forEach(function(d){
                    inner += '<option>' + d + '</option>';
                });
                $dropdown.append(inner);
            });
        });
    });
})(jQuery);


var app = angular.module("adminApp", []);
app.controller("experimenterCtrl", function($scope){
    $scope.experimenter = "";
    $scope.password = "";
    $scope.ha1 = "";
    $scope.loggedIn = false;
    $scope.updateHA1 = function(){
        $scope.ha1 = CryptoJS.MD5($scope.experimenter + ":Experimenters" + $scope.password).toString();
    };
    $scope.$watch("experimenter", $scope.updateHA1);
    $scope.$watch("password", $scope.updateHA1);
    $scope.register = function(){
        var req = "/experimenter?experimenter=" + $scope.experimenter +
            "&ha1="+$scope.ha1;
        $.post(req).success(function(data){
            respond($scope.experimenter + " registered!", "success");
        }).fail(function(data){
            switch(data.status){
            case 400:
                respond(data, "danger");
                break;
            case 409:
                respond("Experimenter already exists!", "danger");
                break;
            default:
                respond("Unknown error: " + data.responseText, "danger");
            }
        });
    };
    $scope.login = function(){
        $.ajaxDigest("/me", {
            username: $scope.experimenter,
            password: $scope.password
        }).done(function(){
            $scope.loggedIn = true;
            respond("Logged in! Welcome " + $scope.username, "success");
        }).fail(function(){
            respond("Login failure!", "danger");
        });
    };
});
