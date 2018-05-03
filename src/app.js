// see http://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
// see http://stackoverflow.com/questions/18662404/download-lengthy-data-as-a-csv-file
var encodings = [
  "UTF-8", "IBM866", "ISO-8859-2", "ISO-8859-3", "ISO-8859-4", "ISO-8859-5",
  "ISO-8859-6", "ISO-8859-7", "ISO-8859-8", "ISO-8859-8-I", "ISO-8859-10",
  "ISO-8859-13", "ISO-8859-14", "ISO-8859-15", "ISO-8859-16", "KOI8-R",
  "KOI8-U", "macintosh", "windows-874", "windows-1250", "windows-1251",
  "windows-1252", "windows-1253", "windows-1254", "windows-1255",
  "windows-1256", "windows-1257", "windows-1258", "x-mac-cyrillic", "GBK",
  "gb18030", "Big5", "EUC-JP", "ISO-2022-JP", "Shift_JIS", "EUC-KR",
  "replacement", "UTF-16BE", "UTF-16LE", "x-user-defined"
]

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

angular.element(document).ready(function() {
  angular.module("app", []);
  angular.module("app").directive("fileread", [
    function() {
      return {
        scope: {
          fileread: "="
        },
        link: function(scope, element, attributes) {
          return element.bind("change", function(changeEvent) {
            var reader;
            reader = new FileReader();
            reader.onload = function(loadEvent) {
              return scope.$apply(function() {
                scope.fileread = loadEvent.target.result;
              });
            };
            reader.readAsText(changeEvent.target.files[0], attributes.encoding);
          });
        }
      };
    }
  ]);
  angular.module("app").directive("dropzone", [
    function() {
      return {
        transclude: true,
        replace: true,
        template: '<div class="dropzone"><div ng-transclude></div></div>',
        scope: {
          dropzone: "="
        },
        link: function(scope, element, attributes) {
          element.bind("dragenter", function(event) {
            element.addClass("dragging");
            event.preventDefault();
          });
          element.bind("dragover", function(event) {
            var efct;
            element.addClass("dragging");
            event.preventDefault();
            efct = event.dataTransfer.effectAllowed;
            event.dataTransfer.dropEffect =
              "move" === efct || "linkMove" === efct ? "move" : "copy";
          });
          element.bind("dragleave", function(event) {
            element.removeClass("dragging");
            event.preventDefault();
          });
          element.bind("drop", function(event) {
            var reader;
            element.removeClass("dragging");
            event.preventDefault();
            event.stopPropagation();
            // Accept either files or text for drag-and-drop
            if (event.dataTransfer.files.length > 0) {
              reader = new FileReader();
              reader.onload = function(loadEvent) {
                scope.$apply(function() {
                  scope.dropzone = loadEvent.target.result;
                });
              };
              reader.readAsText(event.dataTransfer.files[0], attributes.encoding);
            }
            else {
              var index = event.dataTransfer.types.indexOf('text/plain');
              event.dataTransfer.items[index].getAsString(
                function(text) {
                  scope.$apply(function() {
                    scope.dropzone = text;
                  })
                });
            }
          });
        }
      };
    }
  ]);
  // Application code
  angular.module("app").controller("ParseController", function($scope) {
    $scope.angular_loaded = true;
    $scope.ynab_cols = ["Date", "Payee", "Memo", "Outflow", "Inflow"];
    $scope.data = {};
    $scope.ynab_map = {
      Date: "Date",
      Payee: "Payee",
      Memo: "Memo",
      Outflow: "Outflow",
      Inflow: "Inflow"
    };
    $scope.file = {
      encodings: encodings,
      chosenEncoding: "UTF-8"
    };
    $scope.data_object = new DataObject();
    $scope.$watch("data.source", function(newValue, oldValue) {
      if (newValue && newValue.length > 0) {
        $scope.data_object.parse_csv(newValue, $scope.file.chosenEncoding);
        $scope.preview = $scope.data_object.converted_json(10, $scope.ynab_map);
      }
    });
    $scope.$watch(
      "ynab_map",
      function(newValue, oldValue) {
        $scope.preview = $scope.data_object.converted_json(10, newValue);
      },
      true
    );
    $scope.csvString = function() {
      return $scope.data_object.converted_csv(null, $scope.ynab_map);
    };
    $scope.downloadFile = function() {
      var a;
      var date = new Date();
      a = document.createElement("a");
      a.href =
        "data:attachment/csv;base64," +
        btoa(unescape(encodeURIComponent($scope.csvString())));
      a.target = "_blank";
      a.download = `ynab_data_${date.yyyymmdd()}.csv`;
      document.body.appendChild(a);
      a.click();
    };
  });
  angular.bootstrap(document, ["app"]);
});
