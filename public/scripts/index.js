
$("#datepicker").datepicker({
    format: "yyyy",
    viewMode: "years",
    minViewMode: "years",
    endDate: '+0d',
});

$(function() {
    $("#resultsTable tbody tr").on("click", function() {
        var rowData = $(this).find("td").map(function() {
            return $(this).text();
        }).get();
        $("#resultsTable tbody tr").removeClass("table-active");

        $(this).addClass('table-active');
        $("#selectedOption").attr('value', rowData[0]);

        console.log("Clicked row data:", rowData);
    });
});

$(function ($) {
    var $inputs = $('input[name=author],input[name=title]');
    $inputs.on('input', function () {
        // Set the required property of the other input to false if this input is not empty.
        $inputs.not(this).prop('required', !$(this).val().length);
    });
});



$(".table > tr").on('click', () => {
    console.log(this);
    $(this).addClass('table-active');
});

