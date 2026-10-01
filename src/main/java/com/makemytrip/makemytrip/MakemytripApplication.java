package com.makemytrip.makemytrip;
import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MakemytripApplication {

    public static void main(String[] args) {
         Security.addProvider(new BouncyCastleProvider());
        SpringApplication.run(MakemytripApplication.class, args);
    }

}