
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

$(function() {
    const $alertPlaceholder = $('#liveAlertPlaceholder');
    
    if ($alertPlaceholder){
        const appendAlert = (message, type) => {
            const $wrapper = $(`
                <div class="alert alert-${type} alert-dismissible" role="alert">
                    <div>${message}</div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`
            );
            
            $alertPlaceholder.append($wrapper);
        };
        appendAlert('An error was encountered while executing your query. Please try again.', 'danger');
    }

});

$(function() {
    const $alertPlaceholder = $('#homeLiveAlertPlaceholder');
    const type = $alertPlaceholder.attr('class').split('-')[1];
    const msg = $alertPlaceholder.text();
    
    if ($alertPlaceholder){
        const appendAlert = (message, type) => {
            const $wrapper = $(`
                <div class="alert alert-${type} alert-dismissible" role="alert">
                    <div>${message}</div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`
            );
            
            $alertPlaceholder.replaceWith($wrapper);
        };
        appendAlert(msg, type);
    }

});

$(function() {
    var $stars = $("#ratingStars .fa-star");
    $stars.on('mouseenter', function(){
        //$(this).removeClass("fa-lg");
        $(this).addClass("fa-lg");
        const actualIndex = parseInt($(this).attr('id').charAt(4));
        $stars.filter(function(index){
            return parseInt($(this).attr('id').charAt(4)) <= actualIndex
        }).addClass("hover-star");
        
    }).on('mouseleave', function(){
        $(this).removeClass("fa-lg");
        $stars.removeClass('hover-star');
        //$(this).addClass("fa-lg");
    });

    $stars.on('click', function(){
        $stars.removeClass('checked-star');
        const actualIndex = parseInt($(this).attr('id').charAt(4));
        $stars.filter(function(index){
            return parseInt($(this).attr('id').charAt(4)) <= actualIndex
        }).addClass("checked-star");
        $("#rating").attr('value', actualIndex);

    });

});
