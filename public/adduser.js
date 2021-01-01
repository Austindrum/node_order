$("#excel-file").change(function(e){
    const selectedFile = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(selectedFile);
    fileReader.onload = function(e){
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        let template = "";
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            let rowObject = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[i]]);
            if(rowObject.length > 0){
                for (let j = 0; j < rowObject.length; j++) {
                    template += "<div><input type='text' name='id[]' value='"+ rowObject[j].id +"'><input type='text' name='password[]' value='" + rowObject[j].password +"'></div>"
                }
            }
        }
        template = "<input type='submit' value='送出'>" + template
        $("#excel-json").append(template)
    }
})