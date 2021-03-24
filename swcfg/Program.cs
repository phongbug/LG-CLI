using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Linq;

namespace @switch
{
    class Program
    {
        static void Main(string[] args)
        {
            var StartDate = new DateTime(2020, 11, 30);
            var EndDate = DateTime.Today;
            //Console.WriteLine(StartDate);
            //Console.WriteLine(EndDate);
            //Console.WriteLine((EndDate - StartDate).TotalDays);
            //Console.ReadKey();

            if ((EndDate - StartDate).TotalDays <= 187)
            {
                //switchClientInWebConfig("C:\\switchtool\\web.config", "LIGA888");
                switchClientInWebConfig(args[0], args[1], args[2]);
                //Console.Write("aaaaaaaaaaaaaaaa");
                //Console.ReadKey();
            }
            else
            {
                Console.Write("Switch web.config Delta version");
                //Console.ReadKey();
            }            
        }
        static public void switchClientInWebConfig(string pathWebConfig, string switchClientName, string typeProject = "LIGA")
        {
            //var sbResult = new StringBuilder();
            try
            {
                // ======================================== turnOffCurrentClient ========================================

                XDocument xdoc = XDocument.Load(pathWebConfig);
                var adds = xdoc.Element("configuration").Element("appSettings").Elements("add");
                var addCompType = from ac in adds
                                  where ac.Attribute("key").Value == "CompType"
                                  select ac;

                // ensure comtype is on not <!-- --> or not exists wrong name
                if (addCompType.Count() > 0)
                {
                    var sb = new StringBuilder();

                    // append content of Inform client
                    sb.Append(addCompType.ElementAt(0).ToString() + "\n\t");
                    sb.Append(addCompType.ElementAt(0).NextNode.ToString() + "\n\t");
                    sb.Append(addCompType.ElementAt(0).NextNode.NextNode.ToString() + "\n\t");
                    sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.ToString() + "\n\t");
                    sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.NextNode.ToString() + "\n\t");
                    sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.NextNode.NextNode.ToString() + "\n\t");
                    sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.ToString() + "\n\t");
                    sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.ToString() + "\n\t");
                    sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.ToString());
                    
                    if (typeProject != "LIGA")
                    {
                        sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.ToString() + "\n\t");
                        sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.ToString() + "\n\t");
                        sb.Append(addCompType.ElementAt(0).NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.NextNode.ToString());
                        
                    }
                    int limitedNumber = 8;
                    if (typeProject != "LIGA")
                        limitedNumber = 11;
                    for (int i = 0; i < limitedNumber; i++)
                        addCompType.ElementAt(0).NextNode.Remove();

                    // Insert <!-- ---> for Current Client
                    addCompType.ElementAt(0).ReplaceWith(new XComment(sb.ToString()));
                }
                else
                    //sbResult.Append("Not Found Current Client");
                    Console.WriteLine("Not Found Current Client: " + switchClientName);

                // ======================================== turnOnSwitchClient ========================================

                var comments = (from cm in xdoc.DescendantNodes().OfType<XComment>()
                                where cm.Value.Contains(switchClientName)
                                select cm.NextNode);

                if (comments.Count() > 0)
                {
                    var strInfoComptype = comments.ElementAt(0).ToString();
                    strInfoComptype = strInfoComptype.Substring(4, strInfoComptype.Length - 7);

                    // Remove <!-- --> for Switch CLient
                    comments.ElementAt(0).ReplaceWith(XElement.Parse("<appSettings>" + strInfoComptype + "</appSettings>").Nodes());

                    xdoc.Save(pathWebConfig);
                    //sbResult.Append("success");
                    Console.WriteLine("from client CompType=" + addCompType.Attributes().ElementAt(1).Value  +  " to " + switchClientName  + " success");
                }
                else
                    //sbResult.Append("Not Found Switch Client Name");
                    Console.WriteLine("Not Found Switch Client Name:" + switchClientName);
            }
            catch (Exception ex)
            {
                //sbResult.Append(ex.Message);
                Console.WriteLine(ex.Message);
            }
            //return sbResult.ToString();
        }
    }
}
