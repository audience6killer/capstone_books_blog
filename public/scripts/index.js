
/*$("input[name = 'bookISBN']").prop('disabled', true);
$("input[value = 'title']").prop('checked', true);
$("input[value = 'isbn']").prop('checked', false);

$("input[value = 'title']").click(function(event){
    console.log("Clicked");
    $("input[value = 'isbn']").prop('checked', false);
    $("input[name = 'bookISBN']").val('');
    $("input[name = 'bookISBN']").prop('disabled', true);
    $("input[name = 'bookTitle']").prop('disabled', false);
    $("input[name = 'bookTitle']").focus();
});

$("input[value = 'isbn']").click(function(event){
    console.log("Clicked");
    $("input[value = 'title']").prop('checked', false);
    $("input[name = 'bookTitle']").val('');
    $("input[name = 'bookTitle']").prop('disabled', true);
    $("input[name = 'bookISBN']").prop('disabled', false);
});
*/
$("#datepicker").datepicker({
    format: "yyyy",
    viewMode: "years",
    minViewMode: "years",
    endDate: '+0d',
    });
